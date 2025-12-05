import { Product } from "@/types/product";
import { searchMockProducts } from "../../services/mockProductService";
import { addMockImagesToProducts } from "./productImageUtils";
import { toast } from "sonner";
import { productCatalogService } from "@/services/ProductCatalogService";
import { UnifiedNicoleContext } from "@/services/ai/unified/types";
import { searchMultipleInterests } from "../../zinc/utils/searchUtils";

// Track search operations to prevent duplicate toast notifications
export const searchOperations = new Map();

/**
 * Handle search for marketplace products
 * @param showFullWishlist (optional) - if true, returns all wishlist items for friend (max 24)
 */
export const handleSearch = async (
  term: string, 
  searchIdRef: React.MutableRefObject<string>,
  setIsLoading: (isLoading: boolean) => void,
  setProducts: (products: Product[]) => void,
  personId?: string | null, 
  occasionType?: string | null,
  showFullWishlist?: boolean,
  nicoleContext?: any
): Promise<void> => {
  // Check if this exact search is already in progress and avoid duplicates
  const searchKey = `${term}-${personId || ''}-${occasionType || ''}-${showFullWishlist ? "full" : ""}`;
  if (searchOperations.has(searchKey) && Date.now() - searchOperations.get(searchKey) < 2000) {
    console.log(`Skipping duplicate search for "${term}"`);
    return;
  }
  
  // Record this search operation with timestamp
  searchOperations.set(searchKey, Date.now());
  
  // Clear previous toasts to avoid stacking
  toast.dismiss();
  
  setIsLoading(true);
  console.log(`MarketplaceWrapper: Searching for "${term}" with personId: ${personId}, occasionType: ${occasionType}, fullWishlist: ${showFullWishlist}, nicoleContext:`, nicoleContext);
  
  try {
    let mockResults: Product[] = [];

    // --- Friend Event and Wishlist Logic ---
    let wishlistFriendName: string | null = null;
    let wishlistProducts: Product[] = [];

    // Friend-event pattern matching: "[Friend Name]'s birthday gift" or similar
    const friendWishlistRegex = /^([A-Za-z ]+?)'s (birthday|[a-z]+) gift$/i;
    const friendMatch = term.trim().match(friendWishlistRegex);

    let isFriendEvent = false;

    if (personId || friendMatch) {
      isFriendEvent = true;
      if (friendMatch) {
        wishlistFriendName = friendMatch[1].trim();
      }
      const friendName = wishlistFriendName || (personId ? "Friend" : "Friend");

      // All wishlist items case (if sidebar filter is checked)
      if (showFullWishlist) {
        wishlistProducts = searchMockProducts(`wishlist ${friendName}`, 24)
          .map((item) => ({
            ...item,
            tags: [...(item.tags || []), `From ${friendName}'s Wishlist`],
            fromWishlist: true,
          }));
        mockResults = wishlistProducts;
      } else {
        // Only show most recent 4 wishlist products at the top.
        wishlistProducts = searchMockProducts(`wishlist ${friendName}`, 4)
          .map((item) => ({
            ...item,
            tags: [...(item.tags || []), `From ${friendName}'s Wishlist`],
            fromWishlist: true,
          }));

        // Simulate friend preference items also if wanted
        const friendPreferenceItems = searchMockProducts(`preferences ${friendName} ${occasionType || ""}`, 6)
          .map((item) => ({
            ...item,
            tags: [...(item.tags || []), "Based on preferences"],
            fromPreferences: true,
          }));

        mockResults = [...wishlistProducts, ...friendPreferenceItems];

        // Add some generic recommendations for this occasion type
        if (occasionType) {
          const genericItems = searchMockProducts(`${occasionType} gift ideas`, 6);
          mockResults = [...mockResults, ...genericItems];
        }
      }
      
      // Add mock images and features to friend-related products
      mockResults = addMockImagesToProducts(mockResults);
      setProducts(mockResults);
      
    } else {
      // Enhanced Nicole context from URL parameters
      let enhancedNicoleContext = nicoleContext;
      
      // If no Nicole context provided, check URL for Nicole-specific parameters
      if (!nicoleContext && typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const source = urlParams.get('source');
        
        if (source === 'nicole') {
          const minPrice = urlParams.get('minPrice');
          const maxPrice = urlParams.get('maxPrice');
          const interests = urlParams.get('interests');
          const recipient = urlParams.get('recipient');
          const occasion = urlParams.get('occasion');
          
          enhancedNicoleContext = {
            budget: minPrice && maxPrice ? [parseFloat(minPrice), parseFloat(maxPrice)] as [number, number] : undefined,
            interests: interests ? interests.split(',') : undefined,
            recipient: recipient || undefined,
            occasion: occasion || undefined,
            conversationPhase: 'presenting_results',
            capability: 'search'
          } as UnifiedNicoleContext;
          
          console.log('🎯 SearchOperations: Constructed Nicole context from URL:', enhancedNicoleContext);
        }
      }
      
      // Use ProductCatalogService for real search with Nicole context support
      if (enhancedNicoleContext) {
        console.log('🎯 SearchOperations: Using ProductCatalogService with Nicole context:', enhancedNicoleContext);
        try {
          // Extract price range from Nicole context budget array
          const minPrice = enhancedNicoleContext.budget ? enhancedNicoleContext.budget[0] : undefined;
          const maxPrice = enhancedNicoleContext.budget ? enhancedNicoleContext.budget[1] : undefined;
          
          console.log('🎯 SearchOperations: Extracted price range:', { minPrice, maxPrice });
          
          const response = await productCatalogService.searchProducts(term, {
            limit: 16,
            filters: { minPrice, maxPrice }
          });
          
          if (response.products && response.products.length > 0) {
            console.log(`🎯 SearchOperations: Found ${response.products.length} products with price filtering`);
            setProducts(response.products);
            return;
          }
        } catch (error) {
          console.error('🎯 SearchOperations: ProductCatalogService error:', error);
          // Fall back to mock results
        }
      }
      
      // Fallback to mock search for non-Nicole searches or errors
      mockResults = searchMockProducts(term, 16);
      // Add mock images and features to all mockProducts
      mockResults = addMockImagesToProducts(mockResults);
      
      // Update products state
      setProducts(mockResults);
    }
    
    console.log(`MarketplaceWrapper: Found ${mockResults.length} results for "${term}"`);
    
    // Silently show search results - no toast needed for normal searches
    console.log(`Found ${mockResults.length} products for "${term}"`);
    
  } catch (error) {
    console.error('Error searching for products:', error);
    toast.error('Error searching for products', {
      id: `search-error-${term}`,
    });
  } finally {
    setIsLoading(false);
  }
};

/**
 * Handle multi-interest search for marketplace products
 */
export const handleMultiInterestSearch = async (
  interests: string[],
  searchIdRef: React.MutableRefObject<string>,
  setIsLoading: (isLoading: boolean) => void,
  setProducts: (products: Product[]) => void
): Promise<void> => {
  // Check if this exact search is already in progress
  const searchKey = `multi-${interests.join('-')}`;
  if (searchOperations.has(searchKey) && Date.now() - searchOperations.get(searchKey) < 2000) {
    console.log(`Skipping duplicate multi-interest search for "${interests.join(', ')}"`);
    return;
  }
  
  // Record this search operation with timestamp
  searchOperations.set(searchKey, Date.now());
  
  // Clear previous toasts to avoid stacking
  toast.dismiss();
  
  setIsLoading(true);
  console.log(`🎯 Multi-Interest Search: Searching for interests:`, interests);
  
  try {
    // Use our multi-interest search with enhanced brand diversity
    const searchResult = await searchMultipleInterests(interests, {
      maxProductsPerInterest: 8,
      maxProductsPerBrand: 2, // Enhanced diversity - max 2 per brand
      enableBrandDiversity: true,
      targetTotalResults: 24
    });
    
    console.log(`🎯 Multi-Interest Search: Found ${searchResult.totalResults} diversified products`);
    console.log(`🎯 Multi-Interest Search: Breakdown:`, searchResult.searchBreakdown);
    
    // Convert ZincProduct to Product format for marketplace
    const products: Product[] = searchResult.products.map(zincProduct => ({
      product_id: zincProduct.product_id,
      title: zincProduct.title,
      description: zincProduct.features?.join(', ') || 'No description available',
      price: zincProduct.price,
      image: zincProduct.image,
      category: zincProduct.category || 'General',
      rating: zincProduct.rating || zincProduct.stars || 0,
      tags: [],
      brand: zincProduct.brand || 'Unknown',
      features: zincProduct.features
    }));
    
    setProducts(products);
    
    // Silently complete multi-interest search - no toast needed
    console.log(`Found ${searchResult.totalResults} products across ${interests.length} interests`);
    
  } catch (error) {
    console.error('🎯 Multi-Interest Search: Error:', error);
    toast.error('Error searching for products across interests', {
      id: `multi-search-error-${interests.join('-')}`,
    });
  } finally {
    setIsLoading(false);
  }
};

/**
 * Clear search operations map
 */
export const clearSearchOperations = (): void => {
  searchOperations.clear();
};