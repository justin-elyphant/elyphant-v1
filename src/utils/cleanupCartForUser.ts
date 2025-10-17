/**
 * ONE-TIME UTILITY: Clean up cart data for current user
 * 
 * This utility performs a complete cart reset:
 * 1. Deletes ALL rows from user_carts for the user
 * 2. Deletes ALL rows from cart_sessions for the user
 * 3. Clears relevant localStorage keys
 * 4. Reloads the page
 * 
 * Usage (from browser console):
 * ```
 * import('./utils/cleanupCartForUser').then(m => m.cleanupCartForUser())
 * ```
 */

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export async function cleanupCartForUser() {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('❌ No user logged in');
      toast.error('No user logged in');
      return;
    }

    console.log(`🧹 Starting complete cart cleanup for user ${user.id}...`);
    toast.loading('Cleaning up cart data...');

    // 1. Clear server data via edge function
    const { data, error } = await supabase.functions.invoke('clear-user-cart-sessions', {
      body: { userId: user.id }
    });

    if (error) {
      throw error;
    }

    console.log(`✅ Server cleanup complete:`, data);
    console.log(`   - Deleted ${data.sessionsDeleted} cart_sessions`);
    console.log(`   - Deleted ${data.cartsDeleted} user_carts`);

    // 2. Clear localStorage keys
    const keysToRemove = [
      'guest_cart',
      `cart_${user.id}`,
      `cart_${user.id}_preserved`,
      'cart_session_id'
    ];

    let localKeysCleared = 0;
    keysToRemove.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        localKeysCleared++;
        console.log(`   - Removed localStorage key: ${key}`);
      }
    });

    console.log(`✅ LocalStorage cleanup complete: ${localKeysCleared} keys removed`);

    toast.dismiss();
    toast.success(`Cart cleanup complete! Deleted ${data.sessionsDeleted + data.cartsDeleted} server records and ${localKeysCleared} local keys. Reloading...`);

    // 3. Reload page after brief delay
    setTimeout(() => {
      window.location.reload();
    }, 1500);

    return {
      sessionsDeleted: data.sessionsDeleted,
      cartsDeleted: data.cartsDeleted,
      localKeysCleared
    };

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    toast.error('Failed to clean up cart data');
    throw error;
  }
}
