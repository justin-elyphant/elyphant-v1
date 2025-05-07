
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import MarketplaceContent from "./MarketplaceContent";
import { useProducts } from "@/contexts/ProductContext";
import ProductDetailsDialog from "./product-details/ProductDetailsDialog";
import { useAuth } from "@/contexts/auth";
import FavoritesDropdown from "./FavoritesDropdown";
import { Button } from "@/components/ui/button";
import { getUpcomingOccasions, GiftOccasion } from "./utils/upcomingOccasions";
import SignUpDialog from "./SignUpDialog";
import MarketplaceHeader from "./MarketplaceHeader";
import GiftingCategories from "./GiftingCategories";
import PopularBrands from "./PopularBrands";
import { getMockProducts, searchMockProducts } from "./services/mockProductService";
import { useLocalStorage } from "@/components/gifting/hooks/useLocalStorage";
import MarketplaceLoading from "./MarketplaceLoading";

// Default search terms to load if no query is provided
const DEFAULT_SEARCH_TERMS = ["gift ideas", "popular gifts", "trending products"];

const MarketplaceWrapper = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const productId = searchParams.get("productId");
  const { products, isLoading, setProducts } = useProducts();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [showProductDetails, setShowProductDetails] = useState<string | null>(productId);
  const [upcomingOccasions, setUpcomingOccasions] = useState<GiftOccasion[]>([]);
  const [showSignUpDialog, setShowSignUpDialog] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [userData] = useLocalStorage("userData", null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  useEffect(() => {
    setUpcomingOccasions(getUpcomingOccasions());
  }, []);

  // Ensure we always load products on initial render and when search changes
  useEffect(() => {
    const keyword = searchParams.get("search") || "";
    setSearchTerm(keyword);
    setLocalSearchTerm(keyword);
    
    // Load products with the keyword from URL or use default search if empty
    setIsSearching(true);
    
    // Force a small delay to allow the UI to show the loading state
    setTimeout(() => {
      if (keyword) {
        // Use mock products with search
        console.log("MarketplaceWrapper: Loading products for search term:", keyword);
        const mockResults = searchMockProducts(keyword);
        console.log(`MarketplaceWrapper: Found ${mockResults.length} products for "${keyword}"`);
        
        // Always ensure we have some products
        if (mockResults.length === 0) {
          console.log("MarketplaceWrapper: No search results, using default products");
          setProducts(getMockProducts());
        } else {
          setProducts(mockResults);
        }
      } else {
        // Select a random default search term to load initial products
        const defaultTerm = DEFAULT_SEARCH_TERMS[Math.floor(Math.random() * DEFAULT_SEARCH_TERMS.length)];
        console.log("MarketplaceWrapper: Loading default products for:", defaultTerm);
        const mockResults = getMockProducts();
        console.log(`MarketplaceWrapper: Found ${mockResults.length} default products`);
        setProducts(mockResults);
      }
      
      // Always complete loading after a short delay
      setTimeout(() => {
        setIsSearching(false);
        setInitialLoadComplete(true);
      }, 200); // Shorter delay for faster loading perception
    }, 100);
  }, [searchParams, setProducts]);

  useEffect(() => {
    if (productId) {
      setShowProductDetails(productId);
    } else {
      setShowProductDetails(null);
    }
  }, [productId]);

  const handleSearch = (term: string) => {
    if (term.trim()) {
      setIsSearching(true);
      const params = new URLSearchParams(searchParams);
      params.set("search", term);
      setSearchParams(params);
      
      // Simulate search delay for a more realistic experience
      setTimeout(() => {
        const results = searchMockProducts(term);
        
        // Always ensure we have at least some products
        if (results.length === 0) {
          setProducts(getMockProducts(5));
        } else {
          setProducts(results);
        }
        
        setIsSearching(false);
      }, 300); // Shorter delay for better UX
    }
  };

  const selectedProduct = showProductDetails !== null 
    ? products.find(p => p.product_id === showProductDetails)
    : null;

  // Show loading state during initial load
  if (!initialLoadComplete) {
    return <MarketplaceLoading />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header Section */}
      <div className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <FavoritesDropdown onSignUpRequired={() => setShowSignUpDialog(true)} />
          </div>
          
          {/* Quick Navigation Links */}
          <div className="flex gap-6 mt-4 text-sm overflow-x-auto pb-2">
            {upcomingOccasions.map((occasion) => (
              <Button
                key={occasion.name}
                variant="link"
                className="text-muted-foreground hover:text-foreground whitespace-nowrap"
                onClick={() => {
                  const params = new URLSearchParams(searchParams);
                  params.set("search", occasion.searchTerm);
                  setSearchParams(params);
                }}
              >
                {occasion.name} Gifts
              </Button>
            ))}
            <Button variant="link" className="text-muted-foreground hover:text-foreground whitespace-nowrap">
              Home Favorites
            </Button>
            <Button variant="link" className="text-muted-foreground hover:text-foreground whitespace-nowrap">
              Fashion Finds
            </Button>
            <Button variant="link" className="text-muted-foreground hover:text-foreground whitespace-nowrap">
              Gift Cards
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-6 space-y-8">
        {/* New Hero Header without Search */}
        <MarketplaceHeader 
          searchTerm={localSearchTerm} 
          setSearchTerm={setLocalSearchTerm} 
          onSearch={handleSearch} 
        />
        
        {/* Gift Categories Section */}
        <GiftingCategories />
        
        {/* Popular Brands Section */}
        <PopularBrands />
        
        {/* Product Grid with Filters */}
        <MarketplaceContent 
          products={products}
          isLoading={isLoading || isSearching}
          searchTerm={searchTerm}
        />
      </div>
      
      {/* Sign Up Dialog for non-authenticated interactions */}
      <SignUpDialog 
        open={showSignUpDialog}
        onOpenChange={setShowSignUpDialog} 
      />
      
      {/* Product Details Dialog */}
      <ProductDetailsDialog 
        productId={selectedProduct?.product_id || null}
        open={showProductDetails !== null}
        onOpenChange={(open) => {
          if (!open) {
            const newParams = new URLSearchParams(searchParams);
            newParams.delete("productId");
            setSearchParams(newParams);
          }
        }}
        userData={userData}
      />
    </div>
  );
};

export default MarketplaceWrapper;
