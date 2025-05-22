import { Product } from "@/types/product";
import { searchMockProducts } from "../../services/mockProductService";
import { addMockImagesToProducts } from "./productImageUtils";
import { toast } from "sonner";

// Track search operations to prevent duplicate toast notifications
export const searchOperations = new Map();

/**
 * Handle search for marketplace products
 */
export const handleSearch = (
  term: string, 
  searchIdRef: React.MutableRefObject<string>,
  setIsLoading: (isLoading: boolean) => void,
  setProducts: (products: Product[]) => void,
  personId?: string | null, 
  occasionType?: string | null
): void => {
  // Check if this exact search is already in progress and avoid duplicates
  const searchKey = `${term}-${personId || ''}-${occasionType || ''}`;
  if (searchOperations.has(searchKey) && Date.now() - searchOperations.get(searchKey) < 2000) {
    console.log(`Skipping duplicate search for "${term}"`);
    return;
  }
  
  // Record this search operation with timestamp
  searchOperations.set(searchKey, Date.now());
  
  // Clear previous toasts to avoid stacking
  toast.dismiss();
  
  setIsLoading(true);
  console.log(`MarketplaceWrapper: Searching for "${term}" with personId: ${personId}, occasionType: ${occasionType}`);
  
  try {
    let mockResults: Product[] = [];

    // --- Begin: Friend Event Enhancements ---
    let wishlistFriendName: string | null = null;
    let wishlistProducts: Product[] = [];

    // Friend-event pattern matching: "[Friend Name]'s birthday gift" or other friend event
    // This pattern: "Michael Davis's birthday gift"
    // Strip 'gift' from the end to look for possessive patterns
    const friendWishlistRegex = /^([A-Za-z ]+?)'s (birthday|[a-z]+) gift$/i;
    const friendMatch = term.trim().match(friendWishlistRegex);

    if (personId || friendMatch) {
      // We either have a personId passed, or the search term matches an event for a friend
      if (friendMatch) {
        // From the regexp: [1]=name, [2]=occasion
        wishlistFriendName = friendMatch[1].trim();
      }

      // Fallback to personId as name (for generalization), or use the name from pattern
      const friendName = wishlistFriendName || (personId ? "Friend" : "");

      // Simulate friend's wishlist items using the friend's name, up to 4
      wishlistProducts = searchMockProducts(`wishlist ${friendName}`, 4).map((item) => ({
        ...item,
        tags: [...(item.tags || []), `From ${friendName}'s Wishlist`],
        fromWishlist: true,
      }));

      // Simulate friend preference items also if wanted
      const friendPreferenceItems = searchMockProducts(`preferences ${friendName} ${occasionType || ""}`, 6).map((item) => ({
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
    } else {
      // Regular search without personalization
      mockResults = searchMockProducts(term, 16);
    }
    // Add mock images and features to all mockProducts
    mockResults = addMockImagesToProducts(mockResults);
    
    // Update products state
    setProducts(mockResults);
    
    console.log(`MarketplaceWrapper: Found ${mockResults.length} results for "${term}"`);
    
    // Show success toast only for significant searches and only once
    if (term.length > 3) {
      // Use a short timeout to ensure the UI has settled
      setTimeout(() => {
        // Check if this is still the current search
        if (searchIdRef.current === `search-${term}-${Date.now()}`) {
          toast.success(`Found ${mockResults.length} products for "${term}"`, {
            id: `search-success-${term}`, // Use consistent ID to prevent duplicates
          });
        }
      }, 300);
    }
  } catch (error) {
    console.error('Error searching for products:', error);
    toast.error('Error searching for products', {
      id: `search-error-${term}`, // Use consistent ID to prevent duplicates
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
