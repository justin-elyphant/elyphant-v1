# Image URL Backfill Utility

## Purpose

This utility fixes existing profile images and wishlist item images that were stored as incomplete storage keys (e.g., `camera-capture-123.jpg`) instead of full public URLs.

## What It Does

The backfill utility:
1. **Profile Images**: Scans all profiles and converts storage keys to full Supabase public URLs
2. **Wishlist Items**: Scans all wishlist items and converts image storage keys to full public URLs
3. **Skips**: Already-valid URLs (starting with `http://` or `https://`)

## How to Run

### Option 1: Browser Console (Recommended for Testing)

1. Open your browser console on any page of your app
2. Copy and paste this code:

```javascript
import { backfillAllImages } from '@/utils/backfillImageUrls';

// Run the backfill
backfillAllImages()
  .then(results => {
    console.log('✅ Backfill complete!', results);
  })
  .catch(error => {
    console.error('❌ Backfill failed:', error);
  });
```

### Option 2: Run Individual Backfills

```javascript
import { backfillProfileImages, backfillWishlistImages } from '@/utils/backfillImageUrls';

// Just profiles
backfillProfileImages();

// Just wishlist items
backfillWishlistImages();
```

### Option 3: Add a Dev Button (For Ongoing Use)

Create a temporary admin page with a button:

```tsx
import { backfillAllImages } from '@/utils/backfillImageUrls';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function AdminBackfillPage() {
  const handleBackfill = async () => {
    try {
      toast.info('Starting backfill...');
      const results = await backfillAllImages();
      toast.success(`Backfill complete! Updated ${results.profileResults.updated + results.wishlistResults.updated} images`);
    } catch (error) {
      toast.error('Backfill failed');
      console.error(error);
    }
  };

  return (
    <div className="p-8">
      <h1>Admin: Image URL Backfill</h1>
      <Button onClick={handleBackfill}>Run Backfill</Button>
    </div>
  );
}
```

## Expected Output

```
🚀 Starting complete image URL backfill...

🔧 Starting profile image backfill...
✅ Updated profile abc123: camera-capture-456.jpg → https://dmkxtkvlispxeqfzlczr.supabase.co/storage/v1/object/public/avatars/camera-capture-456.jpg

✅ Profile images backfill complete!
   Updated: 5
   Skipped: 10
   Total: 15

🔧 Starting wishlist item image backfill...
✅ Updated item xyz789: product-image.jpg → https://dmkxtkvlispxeqfzlczr.supabase.co/storage/v1/object/public/product-images/product-image.jpg

✅ Wishlist images backfill complete!
   Updated: 15
   Skipped: 25
   Total items: 40

🎉 All backfills complete!
Summary:
  Profiles: 5 updated, 10 skipped
  Wishlist items: 15 updated, 25 skipped
```

## Safety

- ✅ **Read-only checks**: Only updates rows where image URLs don't start with `http`
- ✅ **Idempotent**: Safe to run multiple times - already-fixed URLs are skipped
- ✅ **No data loss**: Preserves existing full URLs
- ✅ **Detailed logging**: See exactly what changed

## When to Run

- **Once**: After deploying the image normalizer fixes to clean up existing data
- **Optional**: Can be run periodically if you notice any 400 errors on images
- **Not required**: The frontend normalizer handles incomplete URLs gracefully, but backfilling keeps the database clean

## Troubleshooting

**Error: "Failed to update..."**
- Check console for specific error details
- Verify you're authenticated and have the correct permissions
- Try running individual backfills (profiles or wishlists separately)

**Images still showing 400 errors after backfill**
- Check the browser network tab for the failing URL
- Verify the storage bucket exists and has correct RLS policies
- Make sure the file actually exists in Supabase Storage

## Technical Details

- **Profiles table**: Updates `profile_image` column
- **Wishlist items table**: Updates `image_url` column in `wishlist_items`
- **Storage buckets**: Uses `avatars` for profiles, `product-images` for wishlist items
- **Normalization**: Calls `normalizeImageUrl()` utility with appropriate bucket configuration
