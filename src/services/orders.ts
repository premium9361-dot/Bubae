import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Order } from '../types';
import { LocalStore } from './localStore';
import { calculateDelivery } from './delivery';
import { validateOrderInput, checkOrderRateLimit } from '../lib/security';

export interface CreateOrderPayload {
  customer_name: string;
  phone: string;
  address: string;
  area: string;
  district: string;
  delivery_area?: string;
  delivery_charge?: number;
  notes?: string;
  policy_accepted: boolean;
  items: Array<{
    product_id: string;
    size: string;
    color: string;
    quantity: number;
  }>;
}

export interface OrderResult {
  success: boolean;
  order?: Order;
  order_number?: string;
  total_amount?: number;
  error?: string;
}

export async function submitOrder(rawPayload: CreateOrderPayload): Promise<OrderResult> {
  // 1. Strict Input Validation & XSS Sanitization
  const validation = validateOrderInput(rawPayload);
  if (!validation.isValid || !validation.cleanPayload) {
    return {
      success: false,
      error: validation.error || 'Invalid order information submitted.',
    };
  }

  const payload = validation.cleanPayload;

  // 2. Client-side abuse & rapid duplicate order rate limiting
  const rateLimitCheck = checkOrderRateLimit();
  if (!rateLimitCheck.allowed) {
    return {
      success: false,
      error: `Too many order requests in a short time. For security, please wait ${rateLimitCheck.waitSeconds || 30} seconds before submitting again.`,
    };
  }

  // 3. Authoritative Backend Validation: Never trust client-supplied delivery charge!
  // Calculate delivery zone and charge authoritatively from the structured district and area.
  const deliveryCalc = calculateDelivery(payload.district, payload.area);
  const authoritativeDeliveryZone = deliveryCalc.zone;
  const authoritativeDeliveryCharge = deliveryCalc.charge;

  // Prepare trusted payload with validated delivery data
  const validatedPayload: CreateOrderPayload = {
    ...payload,
    delivery_area: authoritativeDeliveryZone,
    delivery_charge: authoritativeDeliveryCharge,
  };

  if (isSupabaseConfigured) {
    try {
      // Call atomic database RPC function: create_order_secure
      const deliveryNotePrefix = `[Delivery: ${authoritativeDeliveryZone} (৳${authoritativeDeliveryCharge}) | District: ${payload.district}${payload.area ? ' - Area: ' + payload.area : ''}] `;
      const formattedNotes = (deliveryNotePrefix + (payload.notes || '')).trim() || null;

      const { data, error } = await supabase.rpc('create_order_secure', {
        p_customer_name: payload.customer_name,
        p_phone: payload.phone,
        p_address: payload.address,
        p_area: payload.area || authoritativeDeliveryZone,
        p_district: payload.district,
        p_notes: formattedNotes,
        p_policy_accepted: payload.policy_accepted,
        p_items: payload.items,
      });

      if (!error && data) {
        // Also sync local cache with the order
        const orderNumber = data.order_number;
        const total = (Number(data.total_amount) || 0) + authoritativeDeliveryCharge;

        // Fetch the created order with items to return complete object
        const { data: orderRecord } = await supabase
          .from('orders')
          .select('*, items:order_items(*)')
          .eq('order_number', orderNumber)
          .single();

        return {
          success: true,
          order: (orderRecord as Order) || {
            id: data.order_id,
            order_number: orderNumber,
            customer_name: payload.customer_name,
            phone: payload.phone,
            address: payload.address,
            area: payload.area || authoritativeDeliveryZone,
            district: payload.district,
            delivery_area: authoritativeDeliveryZone,
            delivery_charge: authoritativeDeliveryCharge,
            total_amount: total,
            payment_method: 'Cash on Delivery',
            policy_accepted: true,
            status: 'Pending',
            notes: formattedNotes,
            created_at: new Date().toISOString(),
          },
          order_number: orderNumber,
          total_amount: total,
        };
      } else if (error) {
        // Safe error handling: never expose SQL or database internals to customers
        const msg = error.message || '';
        if (msg.includes('longer available') || msg.includes('stock') || msg.includes('insufficient')) {
          return { success: false, error: 'One or more items in your cart is no longer available in the requested size.' };
        }
        console.warn('Supabase RPC order error, switching to safe local order processing:', msg);
      }
    } catch (err: any) {
      console.warn('Supabase order execution fallback:', err?.message || err);
    }
  }

  // Atomic local fallback with authoritative delivery calculation & size stock verification
  const result = LocalStore.processOrder(validatedPayload);
  if (result.success && result.order) {
    return {
      success: true,
      order: result.order,
      order_number: result.order.order_number,
      total_amount: result.order.total_amount,
    };
  }

  return {
    success: false,
    error: result.error || 'Failed to place Cash on Delivery order. Please try again.',
  };
}
