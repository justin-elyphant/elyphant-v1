// Temporary test file to backfill order tracking
import { supabase } from "@/integrations/supabase/client";

const testBackfill = async () => {
  const { data, error } = await supabase.functions.invoke('backfill-order-tracking', {
    body: { orderId: '02d50698-a385-460f-9ca8-fbcee438ff72' }
  });

  console.log('Backfill result:', data, error);
};

// Call on page load for testing
if (typeof window !== 'undefined') {
  testBackfill();
}
