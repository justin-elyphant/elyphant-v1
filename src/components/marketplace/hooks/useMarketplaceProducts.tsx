
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { searchMockProducts } from "../services/mockProductService";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { toast } from "sonner";
import { Product } from "@/types/product";

// Track search operations to prevent duplicate toast notifications
const searchOperations = new Map();

export const useMarketplaceProducts = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [products, setProducts] = useState<Product[]>([]);
  const { profile } = useProfile();
  const searchIdRef = useRef<string>("");
  
  // Initial load based on URL search parameter
  useEffect(() => {
    const searchParam = searchParams.get("search");
    if (searchParam) {
      setSearchTerm(searchParam);
      const personId = searchParams.get("personId");
      const occasionType = searchParams.get("occasionType");
      
      // Generate unique ID for this search to prevent duplicate toasts
      const searchId = `search-${searchParam}-${Date.now()}`;
      searchIdRef.current = searchId;
      
      handleSearch(searchParam, personId, occasionType);
    } else {
      // Load some default products with personalization
      loadPersonalizedProducts();
    }
    
    // Cleanup function to clear search operations when component unmounts
    return () => {
      searchOperations.clear();
    };
  }, []);

  // Watch for search parameter changes - using useEffect with searchParams dependency
  // This is optimized to prevent duplicate searches
  useEffect(() => {
    const searchParam = searchParams.get("search");
    if (searchParam && searchParam !== searchTerm) {
      setSearchTerm(searchParam);
      
      // Generate unique ID for this search to prevent duplicate toasts
      const searchId = `search-${searchParam}-${Date.now()}`;
      searchIdRef.current = searchId;
      
      handleSearch(searchParam, searchParams.get("personId"), searchParams.get("occasionType"));
    }
  }, [searchParams]);

  // Add mock product images
  const addMockImagesToProducts = (productsToUpdate: Product[]): Product[] => {
    const mockImageUrls = [
      "https://images.unsplash.com/photo-1611930022073-84f3bb594665?q=80&w=987&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?q=80&w=1032&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1585109649139-366815a0d713?q=80&w=1170&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=1164&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1592921870789-04563d55041c?q=80&w=1170&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?q=80&w=987&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1598509254521-921c70c753f3?q=80&w=1632&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1572635196237-14b3f281503f?q=80&w=1180&auto=format&fit=crop"
    ];
    
    return productsToUpdate.map((product, index) => {
      // If the product doesn't already have an image, assign a mock one
      if (!product.image || product.image === "") {
        return {
          ...product,
          image: mockImageUrls[index % mockImageUrls.length]
        };
      }
      return product;
    });
  };

  // Load personalized products based on user profile
  const loadPersonalizedProducts = () => {
    // Only show loading if we don't already have products
    if (products.length === 0) {
      setIsLoading(true);
    }
    
    // Extract user interests from profile
    const userInterests = profile?.gift_preferences || [];
    const interests = Array.isArray(userInterests) 
      ? userInterests.map(pref => typeof pref === 'string' ? pref : pref.category)
      : [];

    console.log("User interests for personalization:", interests);

    let personalizedProducts: Product[] = [];
    
    // If we have interests, use them for personalized results
    if (interests.length > 0) {
      // Use up to 3 interests to create a personalized mix of products
      const personalizedQuery = interests.slice(0, 3).join(" ");
      personalizedProducts = searchMockProducts(personalizedQuery, 10);
      
      // Tag these products as preference-based
      personalizedProducts.forEach(product => {
        product.tags = product.tags || [];
        product.tags.push("Based on your preferences");
        product.fromPreferences = true;
      });
      
      // Mix in some general products
      const generalProducts = searchMockProducts("gift ideas", 6);
      
      // Combine and shuffle to create a diverse but personalized selection
      personalizedProducts = [...personalizedProducts.slice(0, 10), ...generalProducts.slice(0, 6)]
        .sort(() => Math.random() - 0.5); // Simple shuffle
      
      console.log(`Generated ${personalizedProducts.length} personalized products based on interests`);
    } else {
      // Fallback to default products if no interests
      personalizedProducts = searchMockProducts("gift ideas", 16);
      console.log("No interests found, using default products");
    }
    
    // Add mock images to products
    personalizedProducts = addMockImagesToProducts(personalizedProducts);
    
    setProducts(personalizedProducts);
    setIsLoading(false);
  };
  
  // Enhanced search function with friend preferences
  const handleSearch = (term: string, personId?: string | null, occasionType?: string | null) => {
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
  
  // Handle search submission
  const onSearch = (term: string) => {
    if (!term.trim()) return;
    
    // Update URL parameter
    const params = new URLSearchParams(searchParams);
    params.set("search", term);
    // Clear personId and occasionType since this is a direct search
    params.delete("personId");
    params.delete("occasionType");
    setSearchParams(params);
    
    // Generate unique ID for this search
    const searchId = `search-${term}-${Date.now()}`;
    searchIdRef.current = searchId;
    
    // Directly handle search
    handleSearch(term);
  };

  return { 
    searchTerm, 
    setSearchTerm, 
    isLoading, 
    products,
    onSearch
  };
};
