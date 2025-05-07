
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

  useEffect(() => {
    setUpcomingOccasions(getUpcomingOccasions());
  }, []);

  useEffect(() => {
    const keyword = searchParams.get("search") || "";
    setSearchTerm(keyword);
    setLocalSearchTerm(keyword);
    
    // Load products with the keyword from URL or use default search if empty
    setIsSearching(true);
    
    if (keyword) {
      // Use mock products with search
      const mockResults = searchMockProducts(keyword);
      setProducts(mockResults);
    } else {
      // Select a random default search term to load initial products
      const defaultTerm = DEFAULT_SEARCH_TERMS[Math.floor(Math.random() * DEFAULT_SEARCH_TERMS.length)];
      const mockResults = getMockProducts();
      setProducts(mockResults);
    }
    
    setIsSearching(false);
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
      const params = new URLSearchParams(searchParams);
      params.set("search", term);
      setSearchParams(params);
    }
  };

  const selectedProduct = showProductDetails !== null 
    ? products.find(p => p.product_id === showProductDetails)
    : null;

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
      />
    </div>
  );
};

export default MarketplaceWrapper;
