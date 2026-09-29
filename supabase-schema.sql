-- ==============================================================================
-- BUBAÉ FASHION E-COMMERCE SUPABASE DATABASE SCHEMA
-- Project ID: gewdfuwqtnnovascvmmq
-- Description: Complete schema with RLS, atomic stock deduction, and Storage
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CATEGORIES TABLE (Database-driven category system)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL, -- references categories(slug)
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    old_price NUMERIC(10, 2) CHECK (old_price >= 0),
    image_url TEXT NOT NULL,
    second_image_url TEXT,
    third_image_url TEXT,
    color TEXT NOT NULL,
    sizes TEXT[] NOT NULL DEFAULT ARRAY['S', 'M', 'L', 'XL'],
    description TEXT,
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    is_available BOOLEAN NOT NULL DEFAULT true,
    featured BOOLEAN NOT NULL DEFAULT false,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3B. PRODUCT VARIANTS TABLE (Independent size-wise inventory management)
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    size TEXT NOT NULL,
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (product_id, size)
);

-- Safe migration for existing products without losing existing data:
-- Automatically populates product_variants from products.sizes if not already present
INSERT INTO public.product_variants (product_id, size, stock)
SELECT p.id, s.size, GREATEST(0, FLOOR(p.stock / GREATEST(1, COALESCE(array_length(p.sizes, 1), 1))))
FROM public.products p
CROSS JOIN LATERAL unnest(p.sizes) AS s(size)
ON CONFLICT (product_id, size) DO NOTHING;

-- 4. ORDERS TABLE (Cash on Delivery Only)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    area TEXT NOT NULL,
    district TEXT NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    payment_method TEXT NOT NULL DEFAULT 'Cash on Delivery',
    policy_accepted BOOLEAN NOT NULL DEFAULT true,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ORDER ITEMS TABLE (Snapshots product name and price at time of purchase)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    size TEXT NOT NULL,
    color TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PROFILES TABLE FOR ADMIN ROLE AUTHORIZATION
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to create profile when new auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role)
    VALUES (NEW.id, NEW.email, 'customer')
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper to grant admin authorization to BUBAE2008 account
CREATE OR REPLACE FUNCTION public.grant_admin_role(p_email TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE public.profiles
    SET role = 'admin'
    WHERE LOWER(email) = LOWER(p_email);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. ATOMIC TRANSACTION: CREATE ORDER WITH SAFE INVENTORY DEDUCTION
-- Prevents overselling when multiple customers order concurrently.
-- Uses real database prices rather than browser inputs.
CREATE OR REPLACE FUNCTION public.create_order_secure(
    p_customer_name TEXT,
    p_phone TEXT,
    p_address TEXT,
    p_area TEXT,
    p_district TEXT,
    p_notes TEXT,
    p_policy_accepted BOOLEAN,
    p_items JSONB -- Array of { product_id, size, color, quantity }
)
RETURNS JSONB AS $$
DECLARE
    v_order_id UUID;
    v_order_number TEXT;
    v_total_amount NUMERIC(10, 2) := 0;
    v_item RECORD;
    v_product RECORD;
    v_qty INT;
    v_item_subtotal NUMERIC(10, 2);
    v_order_items JSONB := '[]'::JSONB;
BEGIN
    -- Policy verification
    IF NOT p_policy_accepted THEN
        RAISE EXCEPTION 'Customer must accept the No Return / No Exchange policy.';
    END IF;

    IF jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Cart cannot be empty.';
    END IF;

    -- Generate human-readable Order Number (e.g. BUB-98213)
    v_order_number := 'BUB-' || LPAD(FLOOR(RANDOM() * 900000 + 100000)::TEXT, 6, '0');

    -- Insert Order header first with 0 total (will be updated)
    INSERT INTO public.orders (
        order_number,
        customer_name,
        phone,
        address,
        area,
        district,
        total_amount,
        payment_method,
        policy_accepted,
        status,
        notes
    ) VALUES (
        v_order_number,
        p_customer_name,
        p_phone,
        p_address,
        p_area,
        p_district,
        0,
        'Cash on Delivery',
        p_policy_accepted,
        'Pending',
        p_notes
    ) RETURNING id INTO v_order_id;

    DECLARE
        v_variant RECORD;
    BEGIN
    -- Iterate through each requested item with row-level lock (FOR UPDATE)
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
        product_id UUID,
        size TEXT,
        color TEXT,
        quantity INT
    )
    LOOP
        v_qty := v_item.quantity;

        IF v_qty <= 0 THEN
            RAISE EXCEPTION 'Invalid quantity for product.';
        END IF;

        IF v_item.size IS NULL OR TRIM(v_item.size) = '' THEN
            RAISE EXCEPTION 'Size must be selected for every product item.';
        END IF;

        -- Lock product row atomically to prevent race conditions
        SELECT * INTO v_product
        FROM public.products
        WHERE id = v_item.product_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product with ID % does not exist.', v_item.product_id;
        END IF;

        -- Check variant stock with row lock
        SELECT * INTO v_variant
        FROM public.product_variants
        WHERE product_id = v_item.product_id AND size = v_item.size
        FOR UPDATE;

        IF NOT FOUND OR v_variant.stock < v_qty THEN
            RAISE EXCEPTION 'Sorry, "%" in size % is no longer available in the requested quantity.', v_product.name, v_item.size;
        END IF;

        -- Calculate real subtotal from database price
        v_item_subtotal := v_product.price * v_qty;
        v_total_amount := v_total_amount + v_item_subtotal;

        -- Deduct stock from the EXACT size variant
        UPDATE public.product_variants
        SET stock = stock - v_qty,
            updated_at = NOW()
        WHERE product_id = v_item.product_id AND size = v_item.size;

        -- Recompute product total stock and availability
        UPDATE public.products
        SET stock = (
                SELECT COALESCE(SUM(stock), 0)
                FROM public.product_variants
                WHERE product_id = v_item.product_id
            ),
            is_available = (
                (SELECT COALESCE(SUM(stock), 0) FROM public.product_variants WHERE product_id = v_item.product_id) > 0
            ),
            updated_at = NOW()
        WHERE id = v_item.product_id;

        -- Insert order item snapshotting product name and price
        INSERT INTO public.order_items (
            order_id,
            product_id,
            product_name,
            price,
            quantity,
            size,
            color
        ) VALUES (
            v_order_id,
            v_item.product_id,
            v_product.name,
            v_product.price,
            v_qty,
            v_item.size,
            v_item.color
        );
    END LOOP;

    -- Update final order total amount
    UPDATE public.orders
    SET total_amount = v_total_amount,
        updated_at = NOW()
    WHERE id = v_order_id;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'order_number', v_order_number,
        'total_amount', v_total_amount
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Categories RLS
CREATE POLICY "Allow public read categories" ON public.categories
    FOR SELECT TO public USING (true);

CREATE POLICY "Allow admin manage categories" ON public.categories
    FOR ALL TO authenticated USING (public.is_admin());

-- Products RLS:
-- Public can only see products that are marked available AND stock > 0
CREATE POLICY "Allow public read available products" ON public.products
    FOR SELECT TO public USING (is_available = true AND stock > 0);

-- Admins can view and manage all products
CREATE POLICY "Allow admin manage all products" ON public.products
    FOR ALL TO authenticated USING (public.is_admin());

-- Product Variants RLS:
CREATE POLICY "Allow public read variants" ON public.product_variants
    FOR SELECT TO public USING (true);

CREATE POLICY "Allow admin manage variants" ON public.product_variants
    FOR ALL TO authenticated USING (public.is_admin());

-- Orders RLS:
-- Public creates orders via create_order_secure RPC function.
CREATE POLICY "Allow admin view all orders" ON public.orders
    FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "Allow admin update orders" ON public.orders
    FOR UPDATE TO authenticated USING (public.is_admin());

-- Order Items RLS:
CREATE POLICY "Allow admin view order items" ON public.order_items
    FOR SELECT TO authenticated USING (public.is_admin());

-- Profiles RLS:
CREATE POLICY "Allow user read own profile" ON public.profiles
    FOR SELECT TO authenticated USING (id = auth.uid());

CREATE POLICY "Allow admin view all profiles" ON public.profiles
    FOR SELECT TO authenticated USING (public.is_admin());

-- 9. SUPABASE STORAGE SETUP
-- Run these to configure the product-images bucket:
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Allow public view product images" ON storage.objects
    FOR SELECT TO public USING (bucket_id = 'product-images');

CREATE POLICY "Allow admin upload product images" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (
        bucket_id = 'product-images' AND public.is_admin()
    );

CREATE POLICY "Allow admin update product images" ON storage.objects
    FOR UPDATE TO authenticated USING (
        bucket_id = 'product-images' AND public.is_admin()
    );

CREATE POLICY "Allow admin delete product images" ON storage.objects
    FOR DELETE TO authenticated USING (
        bucket_id = 'product-images' AND public.is_admin()
    );

-- 10. INITIAL SEED DATA (Only current categories: Pants, T-Shirts, Oversized T-Shirts)
INSERT INTO public.categories (name, slug, display_order)
VALUES 
    ('Pants', 'pants', 1),
    ('T-Shirts', 't-shirts', 2),
    ('Oversized T-Shirts', 'oversized-t-shirts', 3)
ON CONFLICT (slug) DO NOTHING;

-- Initial Products Seed
INSERT INTO public.products (name, slug, category, price, old_price, image_url, color, sizes, description, stock, is_available, featured, display_order)
VALUES
    (
        'Black Cargo Pants',
        'black-cargo-pants',
        'pants',
        1590,
        1890,
        'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=900&q=80',
        'Black',
        ARRAY['S', 'M', 'L', 'XL'],
        'Tailored wide-leg cargo silhouette cut from premium durable cotton twill. Features functional utility pockets, comfortable elasticated high-waist band, and clean minimalist hems.',
        20,
        true,
        true,
        1
    ),
    (
        'Elle Wide-Leg Blush Trousers',
        'elle-wide-leg-blush-trousers',
        'pants',
        1690,
        1990,
        'https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?auto=format&fit=crop&w=900&q=80',
        'Blush Pink',
        ARRAY['S', 'M', 'L', 'XL'],
        'Structured high-rise tailored trousers in signature Bubaé blush tone with front pleat detailing and lightweight drape.',
        15,
        true,
        true,
        2
    ),
    (
        'Soft Muse Minimalist T-Shirt',
        'soft-muse-minimalist-t-shirt',
        't-shirts',
        1290,
        1490,
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80',
        'Baby Pink',
        ARRAY['XS', 'S', 'M', 'L', 'XL'],
        '220 GSM 100% organic combed ring-spun cotton tee with a clean ribbed crew neckline and ultra-soft premium hand-feel.',
        25,
        true,
        true,
        3
    ),
    (
        'Aesthetic Milk White T-Shirt',
        'aesthetic-milk-white-t-shirt',
        't-shirts',
        1190,
        1390,
        'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=900&q=80',
        'Milk White',
        ARRAY['S', 'M', 'L', 'XL'],
        'Everyday essential crewneck t-shirt with reinforced seams and pre-shrunk cotton jersey.',
        18,
        true,
        false,
        4
    ),
    (
        'Blush Horizon Oversized T-Shirt',
        'blush-horizon-oversized-t-shirt',
        'oversized-t-shirts',
        1490,
        1750,
        'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=900&q=80',
        'Pastel Rose',
        ARRAY['S', 'M', 'L', 'XL'],
        'Deliberately oversized drop-shoulder tee with relaxed boyfriend silhouette, extended sleeve drape, and breathable heavyweight cotton.',
        12,
        true,
        true,
        5
    ),
    (
        'Onyx Minimalist Oversized Tee',
        'onyx-minimalist-oversized-tee',
        'oversized-t-shirts',
        1490,
        1750,
        'https://images.unsplash.com/photo-1503342394128-c104d54dba01?auto=format&fit=crop&w=900&q=80',
        'Jet Black',
        ARRAY['S', 'M', 'L', 'XL'],
        'Subtle streetwear chic oversized fit in deep jet black with subtle tonal stitching.',
        14,
        true,
        false,
        6
    )
ON CONFLICT (slug) DO NOTHING;

-- ==============================================================================
-- 9. ADMIN SESSIONS TABLE (Active & Connected Devices Tracking)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.admin_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_token_id TEXT NOT NULL UNIQUE,
    device_type TEXT NOT NULL DEFAULT 'Desktop',
    browser TEXT NOT NULL,
    os TEXT NOT NULL,
    is_revoked BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_active_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_user_id ON public.admin_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON public.admin_sessions(session_token_id);

ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin sessions viewable by authenticated user or admin"
    ON public.admin_sessions FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Admin sessions insertable by authenticated user"
    ON public.admin_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin sessions updatable by authenticated user or admin"
    ON public.admin_sessions FOR UPDATE
    USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Admin sessions deletable by authenticated user or admin"
    ON public.admin_sessions FOR DELETE
    USING (auth.uid() = user_id OR public.is_admin());

