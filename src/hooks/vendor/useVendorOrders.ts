import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useVendorAccount } from "./useVendorAccount";

export interface VendorOrder {
  id: string;
  vendor_account_id: string;
  order_id: string | null;
  status: string;
  line_items: any[];
  shipping_address_masked: Record<string, any>;
  total_amount: number;
  vendor_payout: number;
  tracking_number: string | null;
  carrier: string | null;
  customer_name: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export function useVendorOrders(statusFilter?: string) {
  const { data: vendorAccount } = useVendorAccount();

  return useQuery({
    queryKey: ["vendor-orders", vendorAccount?.id, statusFilter],
    enabled: !!vendorAccount?.id,
    queryFn: async (): Promise<VendorOrder[]> => {
      let query = supabase
        .from("vendor_orders")
        .select("*")
        .eq("vendor_account_id", vendorAccount!.id)
        .order("created_at", { ascending: false });

      if (statusFilter && statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as unknown as VendorOrder[]) ?? [];
    },
  });
}

export function useVendorOrderStats() {
  const { data: vendorAccount } = useVendorAccount();

  return useQuery({
    queryKey: ["vendor-order-stats", vendorAccount?.id],
    enabled: !!vendorAccount?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_orders")
        .select("status, total_amount, vendor_payout")
        .eq("vendor_account_id", vendorAccount!.id);

      if (error) throw error;

      const orders = (data as unknown as Pick<VendorOrder, "status" | "total_amount" | "vendor_payout">[]) ?? [];
      const totalOrders = orders.length;
      const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_amount), 0);
      const pendingOrders = orders.filter((o) => o.status === "pending").length;

      return { totalOrders, totalRevenue, pendingOrders };
    },
  });
}
