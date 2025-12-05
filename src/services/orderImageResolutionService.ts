import { getProductDetail } from "@/api/product";
import { productCatalogService } from "./ProductCatalogService";

interface ImageResolutionResult {
  imageUrl: string | null;
  source: 'existing' | 'product_detail' | 'enhanced_detail' | 'title_search' | 'brand_search' | 'placeholder';
}

const imageCache = new Map<string, ImageResolutionResult>();

const isPlaceholder = (url?: string): boolean => {
  if (!url) return true;
  return /placeholder\.svg|unsplash|dummy|default|no-image/i.test(String(url));
};

const cleanProductName = (rawName: string): string => {
  return rawName.replace(/,?\s*\d+\s*(EA|ea|each|pack|ct|count|piece|pc|pcs|unit|units)\.?$/i, '').trim();
};

const getCacheKey = (item: any): string => {
  const productId = item.product_id || item.asin || item.sku || item.product?.product_id;
  const productName = cleanProductName((item as any).title || item.product_name || item.name || "Product");
  return `${productId || 'no-id'}_${productName}`;
};

export const resolveOrderItemImage = async (item: any): Promise<ImageResolutionResult> => {
  const cacheKey = getCacheKey(item);
  
  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey)!;
  }

  const existingImage = item.image || item.product?.image || item.product_image;
  if (existingImage && !isPlaceholder(existingImage)) {
    const result: ImageResolutionResult = { imageUrl: existingImage, source: 'existing' };
    imageCache.set(cacheKey, result);
    return result;
  }

  const productId = item.product_id || item.asin || item.sku || item.product?.product_id;
  const productName = cleanProductName((item as any).title || item.product_name || item.name || "Product");

  // Try product detail API
  if (productId) {
    try {
      const detail = await getProductDetail(productId as string);
      const dImg = detail?.image || detail?.images?.[0];
      if (dImg && !isPlaceholder(dImg)) {
        const result: ImageResolutionResult = { imageUrl: dImg, source: 'product_detail' };
        imageCache.set(cacheKey, result);
        return result;
      }
    } catch (e) {
      console.warn("[OrderImageResolution] getProductDetail failed:", e);
    }
  }

  // Try ProductCatalogService
  if (productId) {
    try {
      const detail = await productCatalogService.getProductDetail(productId);
      const dImg = detail?.main_image || detail?.images?.[0];
      if (dImg && !isPlaceholder(dImg)) {
        const result: ImageResolutionResult = { imageUrl: dImg, source: 'enhanced_detail' };
        imageCache.set(cacheKey, result);
        return result;
      }
    } catch (e) {
      console.warn("[OrderImageResolution] ProductCatalogService failed:", e);
    }
  }

  // Try title-based search
  try {
    const res = await productCatalogService.searchProducts(productName, { limit: 1 });
    const p = res?.products?.[0];
    const sImg = p?.image || p?.main_image || p?.images?.[0];
    if (sImg && !isPlaceholder(sImg)) {
      const result: ImageResolutionResult = { imageUrl: sImg, source: 'title_search' };
      imageCache.set(cacheKey, result);
      return result;
    }
  } catch (e) {
    console.warn("[OrderImageResolution] Title search failed:", e);
  }

  // Fallback to placeholder
  const placeholderResult: ImageResolutionResult = { imageUrl: '/placeholder.svg', source: 'placeholder' };
  imageCache.set(cacheKey, placeholderResult);
  return placeholderResult;
};

export const clearImageCache = () => imageCache.clear();
