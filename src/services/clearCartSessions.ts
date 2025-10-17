import { supabase } from "@/integrations/supabase/client";

export const clearAllCartSessionsForUser = async (userId: string): Promise<number> => {
  try {
    const { data, error } = await supabase.functions.invoke('clear-user-cart-sessions', {
      body: { userId }
    });

    if (error) throw error;

    console.log(`✅ Cleared ${data.deletedCount} cart sessions from server`);
    return data.deletedCount;
  } catch (error) {
    console.error('Failed to clear cart sessions:', error);
    throw error;
  }
};
