-- ==============================================================================
-- BUBAÉ E-COMMERCE — PRODUCTION SUPABASE SECURITY & ROW LEVEL SECURITY (RLS)
-- ==============================================================================
-- Instructions: Run this script in your Supabase Project's SQL Editor to enforce
-- production-grade security, access control, and atomic inventory protections.
-- ==============================================================================

-- 1. Enable Row Level Security (RLS) on all core tables
ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_sessions ENABLE ROW LEVEL SECURITY;

-- 2. Helper function to check if the current requester is an authenticated Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ------------------------------------------------------------------------------
-- 3. PROFILES POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can read own profile or admin" ON public.profiles;
CREATE POLICY "Users can read own profile or admin"
ON public.profiles FOR SELECT
USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id OR public.is_admin());

-- ------------------------------------------------------------------------------
-- 4. PRODUCTS POLICIES
-- Customers can only read active in-stock products; Admins can view and manage all.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
CREATE POLICY "Public can view active products"
ON public.products FOR SELECT
USING (is_available = true AND stock > 0 OR public.is_admin());

DROP POLICY IF EXISTS "Only admin can insert products" ON public.products;
CREATE POLICY "Only admin can insert products"
ON public.products FOR INSERT
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Only admin can update products" ON public.products;
CREATE POLICY "Only admin can update products"
ON public.products FOR UPDATE
USING (public.is_admin());

DROP POLICY IF EXISTS "Only admin can delete products" ON public.products;
CREATE POLICY "Only admin can delete products"
ON public.products FOR DELETE
USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 5. PRODUCT VARIANTS (SIZE-WISE STOCK) POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view product variants" ON public.product_variants;
CREATE POLICY "Public can view product variants"
ON public.product_variants FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Only admin can modify product variants" ON public.product_variants;
CREATE POLICY "Only admin can modify product variants"
ON public.product_variants FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 6. CATEGORIES POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
CREATE POLICY "Public can view categories"
ON public.categories FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Only admin can manage categories" ON public.categories;
CREATE POLICY "Only admin can manage categories"
ON public.categories FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 7. ORDERS & ORDER ITEMS POLICIES
-- Customers CANNOT browse or read orders. Only authorized admins have access.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Only admin can view orders" ON public.orders;
CREATE POLICY "Only admin can view orders"
ON public.orders FOR SELECT
USING (public.is_admin());

DROP POLICY IF EXISTS "Only admin can update orders" ON public.orders;
CREATE POLICY "Only admin can update orders"
ON public.orders FOR UPDATE
USING (public.is_admin());

DROP POLICY IF EXISTS "Only admin can delete orders" ON public.orders;
CREATE POLICY "Only admin can delete orders"
ON public.orders FOR DELETE
USING (public.is_admin());

DROP POLICY IF EXISTS "Only admin can view order items" ON public.order_items;
CREATE POLICY "Only admin can view order items"
ON public.order_items FOR SELECT
USING (public.is_admin());

DROP POLICY IF EXISTS "Only admin can modify order items" ON public.order_items;
CREATE POLICY "Only admin can modify order items"
ON public.order_items FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 8. ADMIN SESSIONS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admin can manage admin sessions" ON public.admin_sessions;
CREATE POLICY "Admin can manage admin sessions"
ON public.admin_sessions FOR ALL
USING (auth.uid() = user_id OR public.is_admin())
WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- ------------------------------------------------------------------------------
-- 9. ATOMIC SECURE ORDER CREATION RPC FUNCTION
-- Concurrently-safe order placement with row-level locking (FOR UPDATE)
-- to prevent inventory overselling and client price/delivery tampering.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_order_secure(
  p_customer_name TEXT,
  p_phone TEXT,
  p_address TEXT,
  p_area TEXT,
  p_district TEXT,
  p_notes TEXT DEFAULT NULL,
  p_policy_accepted BOOLEAN DEFAULT true,
  p_items JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id UUID := gen_random_uuid();
  v_order_num TEXT := 'BUB-' || floor(100000 + random() * 900000)::text;
  v_item RECORD;
  v_prod RECORD;
  v_var RECORD;
  v_calc_subtotal NUMERIC := 0;
  v_item_subtotal NUMERIC := 0;
  v_delivery_zone TEXT;
  v_delivery_fee NUMERIC := 155;
  v_final_total NUMERIC;
BEGIN
  -- Strict server-side verification
  IF p_policy_accepted IS NOT TRUE THEN
    RAISE EXCEPTION 'You must agree to the No Return / No Exchange policy.';
  END IF;

  IF trim(p_customer_name) = '' OR trim(p_phone) = '' OR trim(p_address) = '' THEN
    RAISE EXCEPTION 'Customer name, phone, and address are required.';
  END IF;

  IF jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Order must contain at least one item.';
  END IF;

  -- Authoritative delivery calculation
  IF lower(trim(p_district)) = 'sylhet' THEN
    IF lower(trim(p_area)) LIKE '%main town%' OR lower(trim(p_area)) LIKE '%zindabazar%' OR lower(trim(p_area)) LIKE '%ambarkhana%' THEN
      v_delivery_zone := 'Inside Sylhet (Main Town)';
      v_delivery_fee := 80;
    ELSE
      v_delivery_zone := 'Outside Main Town';
      v_delivery_fee := 115;
    END IF;
  ELSIF lower(trim(p_district)) IN ('sunamganj', 'moulvibazar', 'maulvibazar', 'habiganj') THEN
    v_delivery_zone := 'Sunamganj & Moulvibazar Division';
    v_delivery_fee := 135;
  ELSE
    v_delivery_zone := 'Outside Sylhet (Nationwide)';
    v_delivery_fee := 155;
  END IF;

  -- Process each item with row-level locks on product_variants
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
    product_id UUID,
    size TEXT,
    color TEXT,
    quantity INT
  )
  LOOP
    IF v_item.quantity < 1 THEN
      RAISE EXCEPTION 'Invalid item quantity: %', v_item.quantity;
    END IF;

    -- Fetch product details authoritatively
    SELECT * INTO v_prod FROM public.products WHERE id = v_item.product_id;
    IF NOT FOUND OR v_prod.is_available IS NOT TRUE THEN
      RAISE EXCEPTION 'Product % is no longer available.', v_item.product_id;
    END IF;

    -- Lock and verify specific size variant
    SELECT * INTO v_var
    FROM public.product_variants
    WHERE product_id = v_item.product_id AND upper(size) = upper(v_item.size)
    FOR UPDATE;

    IF NOT FOUND OR v_var.stock < v_item.quantity THEN
      RAISE EXCEPTION 'Sorry, "%" in size % is out of stock.', v_prod.name, v_item.size;
    END IF;

    -- Deduct stock from the selected variant
    UPDATE public.product_variants
    SET stock = stock - v_item.quantity, updated_at = now()
    WHERE id = v_var.id;

    -- Recalculate total product stock
    UPDATE public.products
    SET stock = (SELECT COALESCE(sum(stock), 0) FROM public.product_variants WHERE product_id = v_prod.id),
        is_available = ((SELECT COALESCE(sum(stock), 0) FROM public.product_variants WHERE product_id = v_prod.id) > 0),
        updated_at = now()
    WHERE id = v_prod.id;

    -- Authoritative subtotal calculation
    v_item_subtotal := v_prod.price * v_item.quantity;
    v_calc_subtotal := v_calc_subtotal + v_item_subtotal;

    -- Insert into order_items
    INSERT INTO public.order_items (
      id,
      order_id,
      product_id,
      product_name,
      price,
      quantity,
      size,
      color,
      created_at
    ) VALUES (
      gen_random_uuid(),
      v_order_id,
      v_prod.id,
      v_prod.name,
      v_prod.price,
      v_item.quantity,
      upper(v_item.size),
      COALESCE(v_item.color, 'Default'),
      now()
    );
  END LOOP;

  v_final_total := v_calc_subtotal + v_delivery_fee;

  -- Create order record
  INSERT INTO public.orders (
    id,
    order_number,
    customer_name,
    phone,
    address,
    area,
    district,
    delivery_area,
    delivery_charge,
    total_amount,
    payment_method,
    policy_accepted,
    status,
    notes,
    created_at,
    updated_at
  ) VALUES (
    v_order_id,
    v_order_num,
    trim(p_customer_name),
    trim(p_phone),
    trim(p_address),
    trim(p_area),
    trim(p_district),
    v_delivery_zone,
    v_delivery_fee,
    v_final_total,
    'Cash on Delivery',
    true,
    'Pending',
    p_notes,
    now(),
    now()
  );

  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_order_num,
    'subtotal', v_calc_subtotal,
    'delivery_charge', v_delivery_fee,
    'total_amount', v_final_total
  );
END;
$$;
