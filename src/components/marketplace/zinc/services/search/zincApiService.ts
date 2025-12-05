
/**
 * Service for making product API calls via ProductCatalogService
 */
import { productCatalogService } from "@/services/ProductCatalogService";
import { toast } from "sonner";

// Track whether we've shown the API error toast already
let hasShownApiErrorToast = false;

/**
 * Search products via ProductCatalogService
 */
export const searchZincApi = async (
  query: string,
  maxResults: string
): Promise<any[] | null> => {
  try {
    console.log(`Searching products for query: "${query}", max results: ${maxResults}`);
    
    const response = await productCatalogService.searchProducts(query, { 
      limit: parseInt(maxResults) 
    });

    if (response.error) {
      console.error('Product search error:', response.error);
      
      if (!hasShownApiErrorToast) {
        hasShownApiErrorToast = true;
        toast.error('API Error', {
          description: 'Error searching products. Please try again.',
          duration: 5000,
        });
        
        setTimeout(() => {
          hasShownApiErrorToast = false;
        }, 30000);
      }
      
      return null;
    }

    console.log('Product search response:', response);
    
    if (response.products && response.products.length > 0) {
      console.log(`Found ${response.products.length} results for "${query}"`);
      
      // Reset the error toast flag on successful response
      hasShownApiErrorToast = false;
      
      // Transform to expected format
      return response.products.map((product: any) => ({
        product_id: product.product_id,
        title: product.title,
        price: product.price,
        description: product.description || product.product_description,
        image: product.image || product.main_image,
        images: product.images || [product.image || product.main_image],
        category: product.category,
        retailer: product.retailer || 'Amazon via Zinc',
        rating: product.rating || product.stars || 0,
        stars: product.stars || product.rating || 0,
        review_count: product.review_count || product.num_reviews || 0,
        url: product.url || product.product_url,
        brand: product.brand || '',
        availability: product.availability || 'in_stock'
      }));
    }
    
    console.log(`No results found for "${query}"`);
    return null;
    
  } catch (error) {
    console.error(`Error searching products: ${error}`);
    
    if (!hasShownApiErrorToast) {
      hasShownApiErrorToast = true;
      toast.error('API Connection Error', {
        description: 'Failed to connect to product search API. Please try again.',
        duration: 5000,
      });
      
      setTimeout(() => {
        hasShownApiErrorToast = false;
      }, 30000);
    }
    
    return null;
  }
};
