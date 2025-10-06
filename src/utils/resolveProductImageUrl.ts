
// Robust product image resolver used across cart and related views
// Tries multiple fields and array shapes, then falls back to a category-based image if needed

import { getExactProductImage } from "@/components/marketplace/zinc/utils/images/productImageUtils";

function isValidImageString(val: any): val is string {
  if (!val || typeof val !== "string") return false;
  const trimmed = val.trim();
  if (!trimmed || trimmed === "null" || trimmed === "undefined" || trimmed.toLowerCase().includes("placeholder")) return false;
  // Accept http(s), data URIs, blob, and root-relative paths
  return (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:image") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("/")
  );
}

function extractFromImageObject(obj: any): string | undefined {
  if (!obj || typeof obj !== "object") return undefined;
  const keys = [
    "hiRes",
    "large",
    "medium",
    "small",
    "image",
    "image_url",
    "url",
    "src",
    "link",
    "href",
    "main_image",
    "thumbnail",
    "thumb",
  ];
  for (const k of keys) {
    const val = obj[k];
    if (isValidImageString(val)) return val;
  }
  return undefined;
}

export function resolveProductImageUrl(product: any): string {
  if (!product) return "/placeholder.svg";

  const candidates: string[] = [];

  // 1) From images array (strings or objects)
  if (Array.isArray(product.images)) {
    for (const entry of product.images) {
      if (isValidImageString(entry)) {
        candidates.push(entry);
      } else {
        const extracted = extractFromImageObject(entry);
        if (extracted) candidates.push(extracted);
      }
    }
  }

  // 2) Common single-image fields
  const singleFields = [
    product.image,
    product.main_image,
    (product as any).image_url,
    (product as any).imageUrl,
    (product as any).mainImage,
    (product as any).thumbnail,
    (product as any).thumb,
  ];
  for (const val of singleFields) {
    if (isValidImageString(val)) candidates.push(val);
  }

  // 3) Choose first valid candidate
  const valid = candidates.find(isValidImageString);
  if (valid) return valid;

  // 4) Smart generated fallback (mirrors delivered orders behavior)
  const title = product.title || product.name || "";
  const category = product.category || product.category_name || "";
  if (title) {
    try {
      const fallback = getExactProductImage(title, category);
      if (isValidImageString(fallback)) return fallback;
    } catch (e) {
      // noop
    }
  }

  // 5) Final hard fallback
  return "/placeholder.svg";
}
