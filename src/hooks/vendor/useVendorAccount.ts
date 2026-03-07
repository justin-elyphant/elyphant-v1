import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";

export interface VendorAccount {
  id: string;
  user_id: string;
  company_name: string;
  contact_email: string;
  approval_status: string;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useVendorAccount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["vendor-account", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<VendorAccount | null> => {
      const { data, error } = await supabase
        .from("vendor_accounts")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (error) throw error;
      return data as VendorAccount | null;
    },
  });
}
