
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
  personId?: string | null, 
  occasionType?: string | null,
  searchIdRef: React.MutableRefObject<string>,
  setIsLoading: (isLoading: boolean) => void,
  setProducts: (products: Product[]) => void
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
    
    // Check if we have a personId (meaning this is a friend's event)
    if (personId) {
      // Simulate getting friend's wishlist and preferences
      // In a real implementation, you would fetch actual wishlist items and preferences
      const friendWishlistItems = searchMockProducts(`wishlist ${term}`, 4);
      const friendPreferenceItems = searchMockProducts(`preferences ${term}`, 6);
      
      // Tag the wishlist items
      friendWishlistItems.forEach(item => {
        // Extract the person's name from the search term
        const nameMatch = term.match(/^([^\s]+)/);
        const friendName = nameMatch ? nameMatch[1] : "Friend's";
        
        item.tags = item.tags || [];
        item.tags.push(`From ${friendName} Wishlist`);
        item.fromWishlist = true;
      });
      
      // Tag the preference based items
      friendPreferenceItems.forEach(item => {
        item.tags = item.tags || [];
        item.tags.push("Based on preferences");
        item.fromPreferences = true;
      });
      
      // Combine wishlist and preference items
      mockResults = [...friendWishlistItems, ...friendPreferenceItems];
      
      // Add some generic recommendations for this occasion type
      if (occasionType) {
        const genericItems = searchMockProducts(`${occasionType} gift ideas`, 6);
        mockResults = [...mockResults, ...genericItems];
      }
    } else {
      // Regular search without personalization
      mockResults = searchMockProducts(term, 16);
    }
    
    // Add mock images to products
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
