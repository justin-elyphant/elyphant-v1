import { Product } from '@/types/product';

/**
 * Transforms legacy product ID arrays to full product objects by fetching from wishlist_items
 */
export const transformProductIdsToObjects = async (
  productIds: string[],
  supabase: any
): Promise<Product[]> => {
  if (!productIds || productIds.length === 0) {
    return [];
  }

  // First check if these are already product objects (have price/title properties)
  if (typeof productIds[0] === 'object') {
    return productIds.map((p: any) => normalizeProductForDisplay(p));
  }

  try {
    // Fetch full product data from wishlist_items
    const { data: wishlistItems, error } = await supabase
      .from('wishlist_items')
      .select('*')
      .in('id', productIds);

    if (error) {
      console.error('Error fetching product data:', error);
      return [];
    }

    // Transform to Product interface format
    return wishlistItems.map((item: any) => ({
      product_id: item.id,
      id: item.id,
      title: item.product_name,
      name: item.product_name,
      price: item.price || 0,
      image: item.image_url,
      image_url: item.image_url,
      category: item.category,
      brand: item.brand,
      description: item.description,
      product_details: item.product_details,
      features: item.features,
      productSource: 'wishlist'
    }));
  } catch (error) {
    console.error('Error transforming product IDs:', error);
    return [];
  }
};

/**
 * Ensures product data has all required fields for display
 */
export const normalizeProductForDisplay = (product: any): Product => {
    return {
      product_id: product.product_id || product.id,
      id: product.id || product.product_id,
      title: product.title || product.product_name || product.name,
      name: product.name || product.title || product.product_name,
      price: parseFloat(product.price) || 0,
      image: product.image || product.image_url,
      category: product.category,
      brand: product.brand,
      description: product.description,
      product_details: product.product_details,
      features: product.features,
      productSource: (product.source || product.productSource || 'manual') as 'zinc_api' | 'shopify' | 'vendor_portal' | 'manual'
    };
};

/**
 * Fallback product for when data is missing
 */
export const createFallbackProduct = (productId: string, executionId: string): Product => {
  return {
    product_id: productId,
    id: productId,
    title: 'Gift Item',
    name: 'Gift Item',
    price: 0,
    image: '',
    description: `Gift item from execution ${executionId.slice(0, 8)}`,
    productSource: 'manual' as const
  };
};