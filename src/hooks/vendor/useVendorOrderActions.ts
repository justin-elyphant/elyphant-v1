import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UpdateStatusPayload {
  vendorOrderId: string;
  status: string;
  trackingNumber?: string;
  carrier?: string;
}

export function useUpdateVendorOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ vendorOrderId, status, trackingNumber, carrier }: UpdateStatusPayload) => {
      // Update vendor_orders
      const updateData: Record<string, any> = {
        status,
        updated_at: new Date().toISOString(),
      };
      if (trackingNumber) updateData.tracking_number = trackingNumber;
      if (carrier) updateData.carrier = carrier;

      const { data: vendorOrder, error } = await supabase
        .from("vendor_orders")
        .update(updateData)
        .eq("id", vendorOrderId)
        .select("id, order_id, tracking_number, carrier, status")
        .single();

      if (error) throw error;

      // Sync tracking to parent orders table if shipped
      if (vendorOrder.order_id && status === "shipped" && trackingNumber) {
        const { error: syncError } = await supabase
          .from("orders")
          .update({
            tracking_number: trackingNumber,
            status: "shipped",
            updated_at: new Date().toISOString(),
          })
          .eq("id", vendorOrder.order_id);

        if (syncError) {
          console.warn("Failed to sync tracking to parent order:", syncError);
        }
      }

      return vendorOrder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-orders"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-order-stats"] });
      toast.success("Order updated");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update order");
    },
  });
}
