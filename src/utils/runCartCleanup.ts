// One-time utility to clear all cart data for a specific user
// Call this from browser console: import('./utils/runCartCleanup').then(m => m.runCartCleanup())

import { clearUserCartData } from '@/services/clearCartSessions';

export async function runCartCleanup(userId?: string) {
  const targetUserId = userId || '0478a7d7-9d59-40bf-954e-657fa28fe251';
  
  console.log(`🧹 Running cart cleanup for user ${targetUserId}...`);
  
  try {
    const result = await clearUserCartData(targetUserId);
    console.log(`✅ Cleanup complete!`);
    console.log(`   - Deleted ${result.sessionsDeleted} cart_sessions`);
    console.log(`   - Deleted ${result.cartsDeleted} user_carts`);
    console.log(`   - Total: ${result.sessionsDeleted + result.cartsDeleted} records removed`);
    return result;
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  }
}
