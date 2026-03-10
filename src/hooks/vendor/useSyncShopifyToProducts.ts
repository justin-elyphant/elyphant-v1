import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useVendorAccount } from "./useVendorAccount";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  storefrontApiRequest,
  STOREFRONT_PRODUCTS_QUERY,
  ShopifyProduct,
} from "@/lib/shopify";

export function useSyncShopifyToProducts() {
  const { data: vendorAccount } = useVendorAccount();
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);

  const syncShopifyProducts = async () => {
    if (!vendorAccount?.id) {
      toast.error("Vendor account not found");
      return;
    }

    setIsSyncing(true);
    try {
      // Fetch live products from Shopify Storefront API
      const result = await storefrontApiRequest(STOREFRONT_PRODUCTS_QUERY, { first: 50 });

      if (!result?.data?.products?.edges?.length) {
        toast.warning("No products found in your Shopify store");
        setIsSyncing(false);
        return;
      }

      const edges: ShopifyProduct[] = result.data.products.edges;
      const rows = edges.map((edge) => {
        const node = edge.node;
        const basePrice = parseFloat(node.priceRange.minVariantPrice.amount);
        const firstImage = node.images.edges[0]?.node.url || null;

        return {
          product_id: `shopify_${node.id.split("/").pop()}`,
          title: node.title,
          price: basePrice,
          image_url: firstImage,
          brand: "Shopify",
          retailer: vendorAccount.company_name || "Vendor",
          vendor_account_id: vendorAccount.id,
          category: null as string | null,
          metadata: {
            shopify_gid: node.id,
            handle: node.handle,
            description: node.description,
            images: node.images.edges.map((img) => img.node.url),
            variants: node.variants.edges.map((v) => ({
              id: v.node.id,
              title: v.node.title,
              price: v.node.price.amount,
              availableForSale: v.node.availableForSale,
              selectedOptions: v.node.selectedOptions,
            })),
            options: node.options,
            product_source: "shopify_sync",
            fulfillment_method: "vendor_direct",
          },
        };
      });

      // Send rows to edge function (uses service_role to bypass RLS)
      const { data: syncResult, error: syncError } = await supabase.functions.invoke(
        "sync-shopify-products",
        { body: { rows } }
      );

      if (syncError) {
        throw syncError;
      }

      const synced = syncResult?.synced ?? 0;
      queryClient.invalidateQueries({ queryKey: ["vendor-products"] });
      toast.success(`Synced ${synced} product${synced !== 1 ? "s" : ""} from Shopify`);
    } catch (err: any) {
      console.error("Shopify sync error:", err);
      toast.error("Failed to sync Shopify products");
    } finally {
      setIsSyncing(false);
    }
  };

  return { syncShopifyProducts, isSyncing };
}
