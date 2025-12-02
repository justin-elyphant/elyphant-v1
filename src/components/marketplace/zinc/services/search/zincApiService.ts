
/**
 * Service for making Zinc API calls via Supabase Edge Functions
 * Updated to use the working Enhanced Zinc API System
 */
import { enhancedZincApiService } from "@/services/enhancedZincApiService";
import { toast } from "sonner";

// Track whether we've shown the API error toast already
let hasShownApiErrorToast = false;

/**
 * Call the Enhanced Zinc API System instead of the legacy zinc-search endpoint
 */
export const searchZincApi = async (
  query: string,
  maxResults: string
): Promise<any[] | null> => {
  try {
    console.log(`Making API call via Enhanced Zinc API System for query: "${query}", max results: ${maxResults}`);
    
    // Use the working Enhanced Zinc API System
    const response = await enhancedZincApiService.searchProducts(query, 1, parseInt(maxResults));

    if (response.error && !response.cached) {
      console.error('Enhanced Zinc API error:', response.error);
      
      if (!hasShownApiErrorToast) {
        hasShownApiErrorToast = true;
        toast.error('API Error', {
          description: 'Error calling Zinc API. Please check your API configuration.',
          duration: 5000,
        });
        
        setTimeout(() => {
          hasShownApiErrorToast = false;
        }, 30000);
      }
      
      return null;
    }

    console.log('Enhanced Zinc API response:', response);
    
    if (response.results && response.results.length > 0) {
      console.log(`Found ${response.results.length} results from Enhanced Zinc API for "${query}"`);
      
      // Reset the error toast flag on successful response
      hasShownApiErrorToast = false;
      
      // Transform to expected format
      return response.results.map((product: any) => ({
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
    
    console.log(`No results found from Enhanced Zinc API for "${query}"`);
    return null;
    
  } catch (error) {
    console.error(`Error calling Enhanced Zinc API: ${error}`);
    
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
