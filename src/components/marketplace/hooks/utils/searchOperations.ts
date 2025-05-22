
import { Product } from "@/types/product";
import { searchMockProducts } from "../../services/mockProductService";
import { addMockImagesToProducts } from "./productImageUtils";
import { toast } from "sonner";

// Track search operations to prevent duplicate toast notifications
export const searchOperations = new Map();

/**
 * Handle search for marketplace products
 * @param showFullWishlist (optional) - if true, returns all wishlist items for friend (max 24)
 */
export const handleSearch = (
  term: string, 
  searchIdRef: React.MutableRefObject<string>,
  setIsLoading: (isLoading: boolean) => void,
  setProducts: (products: Product[]) => void,
  personId?: string | null, 
  occasionType?: string | null,
  showFullWishlist?: boolean
): void => {
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
  console.log(`MarketplaceWrapper: Searching for "${term}" with personId: ${personId}, occasionType: ${occasionType}, fullWishlist: ${showFullWishlist}`);
  
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
      setTimeout(() => {
        // Check if this is still the current search
        if (searchIdRef.current === `search-${term}-${Date.now()}`) {
          toast.success(`Found ${mockResults.length} products for "${term}"`, {
            id: `search-success-${term}`,
          });
        }
      }, 300);
    }
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
 * Clear search operations map
 */
export const clearSearchOperations = (): void => {
  searchOperations.clear();
};

