import { supabase } from "@/integrations/supabase/client";
import { normalizeImageUrl } from "./normalizeImageUrl";

/**
 * Backfill helper to convert storage keys to full public URLs
 * This should be run once to fix existing data with incomplete image references
 */
export async function backfillProfileImages() {
  console.log("🔧 Starting profile image backfill...");
  
  try {
    // Fetch all profiles with image fields
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, profile_image')
      .not('profile_image', 'is', null);

    if (error) throw error;

    let updated = 0;
    let skipped = 0;

    for (const profile of profiles || []) {
      // Skip if already a full URL
      if (profile.profile_image?.startsWith('http')) {
        skipped++;
        continue;
      }

      // Construct full public URL
      const fullUrl = normalizeImageUrl(profile.profile_image, { bucket: 'avatars' });
      
      // Update database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_image: fullUrl })
        .eq('id', profile.id);

      if (updateError) {
        console.error(`Failed to update profile ${profile.id}:`, updateError);
      } else {
        updated++;
        console.log(`✅ Updated profile ${profile.id}: ${profile.profile_image} → ${fullUrl}`);
      }
    }

    console.log(`\n✅ Profile images backfill complete!`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total: ${(profiles || []).length}`);
    
    return { updated, skipped, total: (profiles || []).length };
  } catch (error) {
    console.error("❌ Backfill failed:", error);
    throw error;
  }
}

export async function backfillWishlistImages() {
  console.log("🔧 Starting wishlist item image backfill...");
  
  try {
    // Fetch all wishlist items with image URLs
    const { data: items, error } = await supabase
      .from('wishlist_items')
      .select('id, image_url')
      .not('image_url', 'is', null);

    if (error) throw error;

    let updated = 0;
    let skipped = 0;

    for (const item of items || []) {
      // Skip if already a full URL
      if (item.image_url?.startsWith('http')) {
        skipped++;
        continue;
      }

      // Normalize the URL
      const fullUrl = normalizeImageUrl(item.image_url, { 
        bucket: 'product-images',
        fallback: '/placeholder.svg'
      });

      // Update database if URL changed
      if (fullUrl !== item.image_url) {
        const { error: updateError } = await supabase
          .from('wishlist_items')
          .update({ image_url: fullUrl })
          .eq('id', item.id);

        if (updateError) {
          console.error(`Failed to update wishlist item ${item.id}:`, updateError);
        } else {
          updated++;
          console.log(`✅ Updated item ${item.id}: ${item.image_url} → ${fullUrl}`);
        }
      } else {
        skipped++;
      }
    }

    console.log(`\n✅ Wishlist images backfill complete!`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total items: ${(items || []).length}`);
    
    return { updated, skipped, totalItems: (items || []).length };
  } catch (error) {
    console.error("❌ Backfill failed:", error);
    throw error;
  }
}

/**
 * Run all backfills
 */
export async function backfillAllImages() {
  console.log("🚀 Starting complete image URL backfill...\n");
  
  const profileResults = await backfillProfileImages();
  console.log("\n");
  const wishlistResults = await backfillWishlistImages();
  
  console.log("\n🎉 All backfills complete!");
  console.log("Summary:");
  console.log(`  Profiles: ${profileResults.updated} updated, ${profileResults.skipped} skipped`);
  console.log(`  Wishlist items: ${wishlistResults.updated} updated, ${wishlistResults.skipped} skipped`);
  
  return { profileResults, wishlistResults };
}
