import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SUPABASE_FUNCTIONS } from "@/integrations/supabase/function-types";

export const useAutoGiftTrigger = () => {
  const [triggering, setTriggering] = useState(false);

  const triggerAutoGiftProcessing = async () => {
    if (triggering) return;

    try {
      setTriggering(true);
      console.log('Triggering auto-gift orchestrator...');

      const { data, error } = await supabase.functions.invoke(SUPABASE_FUNCTIONS.AUTO_GIFT_ORCHESTRATOR);

      if (error) {
        console.error('Error triggering auto-gift processing:', error);
        toast.error("Failed to trigger auto-gift processing");
        throw error;
      }

      console.log('Auto-gift processing result:', data);
      toast.success(`Auto-gift processing completed. Processed ${data.processedEvents || 0} events.`);
      
      return data;
    } catch (error) {
      console.error('Auto-gift trigger error:', error);
      toast.error("Failed to trigger auto-gift processing");
      throw error;
    } finally {
      setTriggering(false);
    }
  };

  return {
    triggerAutoGiftProcessing,
    triggering
  };
};
