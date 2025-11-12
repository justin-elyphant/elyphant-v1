import { supabase } from "@/integrations/supabase/client";

export type ImageBucket = 'avatars' | 'wishlist-covers' | 'product-images';

interface NormalizeImageOptions {
  bucket?: ImageBucket;
  fallback?: string;
}

const DEFAULT_FALLBACK = '/placeholder.svg';

/**
 * Normalizes image URLs to handle both full URLs and storage keys
 * - If value is already a full URL (http/https), returns as-is
 * - If value is a storage key, constructs the public URL
 * - If value is empty/invalid, returns fallback placeholder
 */
export function normalizeImageUrl(
  value: string | null | undefined,
  options: NormalizeImageOptions = {}
): string {
  const { bucket = 'avatars', fallback = DEFAULT_FALLBACK } = options;

  // Empty or invalid value
  if (!value || value.trim() === '') {
    return fallback;
  }

  // Already a full URL
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }

  // Blob URL (from camera/file upload before save)
  if (value.startsWith('blob:')) {
    return value;
  }

  // Storage key - construct public URL
  try {
    const { data } = supabase.storage.from(bucket).getPublicUrl(value);
    return data.publicUrl;
  } catch (error) {
    console.warn(`Failed to construct public URL for storage key: ${value}`, error);
    return fallback;
  }
}
