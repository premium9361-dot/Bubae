export type CategorySlug = string;

export interface Category {
  id?: string;
  name: string;
  slug: string;
  display_order?: number;
}

export interface ProductColor {
  name: string;
  hex?: string;
}

export type ProductSize = 'S' | 'M' | 'L' | 'XL' | 'XXL' | string;

export interface ProductVariant {
  id?: string;
  product_id: string;
  size: string;
  stock: number;
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string; // e.g. 'pants', 't-shirts', 'oversized-t-shirts'
  categoryName?: string;
  price: number;
  old_price?: number | null;
  oldPrice?: number | null;
  discount?: string | number;
  image_url: string;
  second_image_url?: string | null;
  third_image_url?: string | null;
  images?: string[];
  color: string;
  colors?: Array<{ name: string; hex: string }>;
  sizes: string[];
  variants?: ProductVariant[];
  sizeStock?: Record<string, number>; // Size -> stock lookup map e.g. { 'M': 10, 'L': 2, 'XL': 5, 'XXL': 0 }
  description?: string;
  details?: string[];
  fabric?: string;
  careInstructions?: string[];
  stock: number; // Sum of size variants, managed in Admin, hidden from customer
  is_available: boolean;
  available?: boolean;
  featured?: boolean;
  newArrival?: boolean;
  display_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CartItem {
  id: string; // unique item key: `${productId}-${size}-${color}`
  productId: string;
  product: Product;
  selectedSize: string;
  selectedColor: string | ProductColor;
  quantity: number;
  unitPrice: number;
}

export type OrderStatus = 
  | 'Pending'
  | 'Confirmed'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string;
  product_name: string;
  price: number;
  quantity: number;
  size: string;
  color: string;
  created_at?: string;
}

export interface OrderEditHistoryEntry {
  id: string;
  field: string;
  field_label: string;
  previous_value: string;
  new_value: string;
  changed_at: string;
  changed_by?: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  phone: string;
  address: string;
  area: string;
  district: string;
  delivery_area?: string;
  delivery_charge?: number;
  total_amount: number;
  payment_method: 'Cash on Delivery';
  policy_accepted: boolean;
  status: OrderStatus;
  notes?: string | null;
  created_at: string;
  updated_at?: string;
  items?: OrderItem[];
  edit_history?: OrderEditHistoryEntry[];
}

export interface AdminUser {
  id: string;
  email: string;
  username?: string;
  role: 'admin';
}
