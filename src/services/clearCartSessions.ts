import { supabase } from "@/integrations/supabase/client";

export const clearUserCartData = async (userId: string): Promise<{ sessionsDeleted: number; cartsDeleted: number }> => {
  try {
    console.log(`🧹 Clearing ALL cart data for user ${userId}...`);
    
    const { data, error } = await supabase.functions.invoke('clear-user-cart-sessions', {
      body: { userId }
    });

    if (error) throw error;

    console.log(`✅ Cleared ${data.sessionsDeleted} cart_sessions and ${data.cartsDeleted} user_carts from server`);
    return {
      sessionsDeleted: data.sessionsDeleted,
      cartsDeleted: data.cartsDeleted
    };
  } catch (error) {
    console.error('❌ Failed to clear cart data:', error);
    throw error;
  }
};
