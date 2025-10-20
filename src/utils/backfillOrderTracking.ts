import { supabase } from "@/integrations/supabase/client";

export const backfillOrderTracking = async (orderId: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('backfill-order-tracking', {
      body: { orderId }
    });

    if (error) {
      console.error('Error backfilling tracking:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error calling backfill function:', error);
    return { success: false, error };
  }
};
