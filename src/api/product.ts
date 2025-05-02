
import { supabase } from "@/integrations/supabase/client";
import { SUPABASE_FUNCTIONS } from '@/constants/supabaseFunctions';

export const getProductDetail = async (product_id: string, retailer: string) => {
    try {
      const { data, error } = await supabase.functions.invoke(SUPABASE_FUNCTIONS.GET_PRODUCT_DETAIL, {
        body: {
            product_id,
            retailer: retailer || "amazon"
        }
      });
      if (error) {
        return null;
      }
      return data;
    } catch(e) {
      console.log('Get Product Detail failed: ', e);
      return null;
    }
}
