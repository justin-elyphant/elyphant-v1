
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type ApprovalAction = "approved" | "rejected" | "suspended";

interface ApprovalPayload {
  vendor_account_id: string;
  action: ApprovalAction;
}

export function useVendorApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ vendor_account_id, action }: ApprovalPayload) => {
      const { data, error } = await supabase.functions.invoke("approve-vendor", {
        body: { vendor_account_id, action },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (_, { action }) => {
      const labels: Record<ApprovalAction, string> = {
        approved: "Vendor approved successfully",
        rejected: "Vendor application rejected",
        suspended: "Vendor account suspended",
      };
      toast.success(labels[action]);
      queryClient.invalidateQueries({ queryKey: ["trunkline-vendors"] });
    },
    onError: (err: Error) => {
      toast.error(`Action failed: ${err.message}`);
    },
  });
}
