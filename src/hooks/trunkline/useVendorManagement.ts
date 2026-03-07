
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Vendor } from "@/components/trunkline/vendors/types";

export function useVendorManagement(searchTerm?: string, statusFilter?: string) {
  return useQuery({
    queryKey: ["trunkline-vendors", searchTerm, statusFilter],
    queryFn: async (): Promise<Vendor[]> => {
      let query = supabase
        .from("vendor_accounts")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter && statusFilter !== "all") {
        query = query.eq("approval_status", statusFilter);
      }

      if (searchTerm?.trim()) {
        query = query.or(
          `company_name.ilike.%${searchTerm.trim()}%,contact_email.ilike.%${searchTerm.trim()}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data ?? []).map((row) => ({
        id: row.id,
        user_id: row.user_id,
        company_name: row.company_name,
        contact_email: row.contact_email,
        approval_status: row.approval_status as Vendor["approval_status"],
        approved_by: row.approved_by,
        description: row.description,
        phone: row.phone,
        website: row.website,
        logo_url: row.logo_url,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));
    },
  });
}
