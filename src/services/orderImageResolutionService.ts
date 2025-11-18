import { getProductDetail } from "@/api/product";
import { enhancedZincApiService } from "./enhancedZincApiService";

interface ImageResolutionResult {
  imageUrl: string | null;
  source: 'existing' | 'product_detail' | 'enhanced_detail' | 'title_search' | 'brand_search' | 'placeholder';
}

// Cache to prevent repeated API calls for the same product
const imageCache = new Map<string, ImageResolutionResult>();

// Helper to detect placeholder/mock images
const isPlaceholder = (url?: string): boolean => {
  if (!url) return true;
  return /placeholder\.svg|unsplash|dummy|default|no-image/i.test(String(url));
};

// Extract clean product name by removing redundant quantity indicators
const cleanProductName = (rawName: string): string => {
  return rawName.replace(/,?\s*\d+\s*(EA|ea|each|pack|ct|count|piece|pc|pcs|unit|units)\.?$/i, '').trim();
};

// Generate cache key for the item
const getCacheKey = (item: any): string => {
  const productId = item.product_id || item.asin || item.sku || item.product?.product_id;
  const productName = cleanProductName((item as any).title || item.product_name || item.name || "Product");
  return `${productId || 'no-id'}_${productName}`;
};

export const resolveOrderItemImage = async (item: any): Promise<ImageResolutionResult> => {
  const cacheKey = getCacheKey(item);
  
  // Check cache first
  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey)!;
  }

  const productName = cleanProductName((item as any).title || item.product_name || item.name || "Product");
  const productId = item.product_id || item.asin || item.sku || item.product?.product_id;
  const retailer = item.retailer || item.product?.retailer || "amazon";

  // 1. Check existing image fields
  const initialImageUrl = item.product_image || 
                         item.image_url || 
                         item.image || 
                         item.images?.[0] ||
                         item.product?.image ||
                         item.product?.images?.[0];

  if (initialImageUrl && !isPlaceholder(initialImageUrl)) {
    const result: ImageResolutionResult = {
      imageUrl: initialImageUrl,
      source: 'existing'
    };
    imageCache.set(cacheKey, result);
    return result;
  }

  console.log("[OrderImageResolution] Resolving image for:", { productName, productId, retailer });

  // 2. Try product detail via simple helper
  if (productId) {
    try {
      const prod = await getProductDetail(productId, retailer);
      const pImg = prod?.image || prod?.images?.[0];
      if (pImg && !isPlaceholder(pImg)) {
        console.log("[OrderImageResolution] Found image via getProductDetail:", pImg);
        const result: ImageResolutionResult = {
          imageUrl: pImg,
          source: 'product_detail'
        };
        imageCache.set(cacheKey, result);
        return result;
      }
    } catch (e) {
      console.warn("[OrderImageResolution] getProductDetail failed:", e);
    }
  }

  // 3. Try enhanced product detail service
  if (productId) {
    try {
      const detail = await enhancedZincApiService.getProductDetails(productId);
      const dImg = detail?.image || detail?.main_image || detail?.images?.[0];
      if (dImg && !isPlaceholder(dImg)) {
        console.log("[OrderImageResolution] Found image via enhanced service:", dImg);
        const result: ImageResolutionResult = {
          imageUrl: dImg,
          source: 'enhanced_detail'
        };
        imageCache.set(cacheKey, result);
        return result;
      }
    } catch (e) {
      console.warn("[OrderImageResolution] Enhanced service failed:", e);
    }
  }

  // 4. Try title-based search
  try {
    const res = await enhancedZincApiService.searchProducts(productName, 1, 12);
    const p = res?.results?.[0];
    const sImg = p?.image || p?.main_image || p?.images?.[0];
    if (sImg && !isPlaceholder(sImg)) {
      console.log("[OrderImageResolution] Found image via title search:", sImg);
      const result: ImageResolutionResult = {
        imageUrl: sImg,
        source: 'title_search'
      };
      imageCache.set(cacheKey, result);
      return result;
    }
  } catch (e) {
    console.warn("[OrderImageResolution] Title search failed:", e);
  }

  // 5. Try brand search (lightweight)
  try {
    const firstWord = String(productName).split(' ')[0];
    if (firstWord && firstWord.length > 2) {
      const res = await enhancedZincApiService.searchBrandCategories(firstWord, 1);
      const p = res?.results?.[0];
      const bImg = p?.image || p?.main_image || p?.images?.[0];
      if (bImg) {
        console.log("[OrderImageResolution] Found image via brand search:", bImg);
        const result: ImageResolutionResult = {
          imageUrl: bImg,
          source: 'brand_search'
        };
        imageCache.set(cacheKey, result);
        return result;
      }
    }
  } catch (e) {
    console.warn("[OrderImageResolution] Brand search failed:", e);
  }

  // 6. Fallback to placeholder
  const result: ImageResolutionResult = {
    imageUrl: null,
    source: 'placeholder'
  };
  imageCache.set(cacheKey, result);
  return result;
};

// Clear cache when needed (e.g., on app restart)
export const clearImageCache = (): void => {
  imageCache.clear();
};

// Get cache size for debugging
export const getImageCacheSize = (): number => {
  return imageCache.size;
};