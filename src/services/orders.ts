import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Order } from '../types';
import { LocalStore } from './localStore';
import { calculateDelivery } from './delivery';

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

export async function submitOrder(payload: CreateOrderPayload): Promise<OrderResult> {
  if (!payload.policy_accepted) {
    return {
      success: false,
      error: 'You must agree to Bubaé’s No Return / No Exchange policy before placing your order.',
    };
  }

  // Authoritative Backend Validation: Never trust client-supplied delivery charge!
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
      // 1. Call atomic database RPC function: create_order_secure
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
        console.warn('Supabase RPC order error, attempting local fallback:', error.message);
        // If it's a validation error (like stock insufficient), surface it
        if (error.message.includes('longer available') || error.message.includes('stock')) {
          return { success: false, error: error.message };
        }
      }
    } catch (err: any) {
      console.warn('Supabase order execution fallback:', err);
    }
  }

  // Atomic local fallback with authoritative delivery calculation
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
