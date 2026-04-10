/**
 * @deprecated Orders were removed from the Supabase Realtime publication
 * for security reasons (prevented broadcasting sensitive order data to all
 * subscribers). Order status updates now rely on polling/refetch via
 * React Query's invalidateQueries. This hook is kept as a no-op stub so
 * existing call-sites don't break.
 */

interface OrderUpdate {
  id: string;
  status: string;
  zinc_status?: string;
  zinc_timeline_events?: any[];
  merchant_tracking_data?: any;
  last_zinc_update?: string;
}

interface UseOrderRealtimeProps {
  orderId?: string;
  onOrderUpdate?: (order: OrderUpdate) => void;
  showNotifications?: boolean;
}

export function useOrderRealtime(_props: UseOrderRealtimeProps) {
  // No-op: Realtime subscription removed for security hardening.
  // Order updates are now fetched via React Query polling.
  return {};
}
