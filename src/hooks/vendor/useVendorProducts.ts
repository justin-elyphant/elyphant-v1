import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useVendorAccount } from "./useVendorAccount";

export interface VendorProduct {
  id: string;
  product_id: string;
  title: string;
  price: number | null;
  image_url: string | null;
  category: string | null;
  brand: string | null;
  retailer: string | null;
  created_at: string | null;
  view_count: number | null;
  purchase_count: number | null;
}

export function useVendorProducts() {
  const { data: vendorAccount } = useVendorAccount();

  return useQuery({
    queryKey: ["vendor-products", vendorAccount?.id],
    enabled: !!vendorAccount?.id,
    queryFn: async (): Promise<VendorProduct[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("id, product_id, title, price, image_url, category, brand, retailer, created_at, view_count, purchase_count")
        .eq("vendor_account_id", vendorAccount!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as unknown as VendorProduct[]) ?? [];
    },
  });
}
