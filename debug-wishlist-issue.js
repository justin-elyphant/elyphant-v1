// Debug: Let's create a simple test to see what data is being returned
// This will help us identify where the "1 wishlist" is coming from

import { supabase } from '@/integrations/supabase/client';

export const debugWishlistIssue = async () => {
  const duaUserId = '54087479-29f1-4f7f-afd0-cbdc31d6fb91';
  
  console.log('=== DEBUGGING WISHLIST ISSUE ===');
  
  // 1. Check direct wishlist count from database
  const { count: directCount } = await supabase
    .from('wishlists')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', duaUserId)
    .eq('is_public', true);
    
  console.log('Direct database count:', directCount);
  
  // 2. Check what publicProfileService.getWishlistCount would return
  try {
    const { count: serviceCount } = await supabase
      .from('wishlists')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', duaUserId)
      .eq('is_public', true);
    
    console.log('Service method count:', serviceCount);
  } catch (error) {
    console.error('Service method error:', error);
  }
  
  // 3. Check if there are any wishlists with different privacy settings
  const { data: allWishlists } = await supabase
    .from('wishlists')
    .select('*')
    .eq('user_id', duaUserId);
    
  console.log('All wishlists for user:', allWishlists);
  
  // 4. Check if there's profile data with embedded wishlist info
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', duaUserId)
    .single();
    
  console.log('Profile data wishlists field:', profileData?.wishlists);
};

// Add to window for manual testing
if (typeof window !== 'undefined') {
  window.debugWishlistIssue = debugWishlistIssue;
}