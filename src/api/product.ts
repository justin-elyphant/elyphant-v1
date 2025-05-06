
import { supabase } from "@/integrations/supabase/client";
import { SUPABASE_FUNCTIONS } from '@/integrations/supabase/function-types';
import { normalizeProduct, Product } from "@/contexts/ProductContext";

export const getProductDetail = async (product_id: string, retailer: string): Promise<Product | null> => {
    try {
      const { data, error } = await supabase.functions.invoke(SUPABASE_FUNCTIONS.GET_PRODUCT_DETAIL, {
        body: {
            product_id,
            retailer: retailer || "amazon"
        }
      });
      
      if (error) {
        console.error("Error fetching product detail:", error);
        return null;
      }
      
      // Normalize the product data to ensure consistent structure
      return data ? normalizeProduct(data) : null;
    } catch(e) {
      console.log('Get Product Detail failed: ', e);
      return null;
    }
}
