import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import MarketplaceContent from "./MarketplaceContent";
import { useProducts } from "@/contexts/ProductContext";
import ProductDetailsDialog from "./product-details/ProductDetailsDialog";
import { useAuth } from "@/contexts/auth";
import FavoritesDropdown from "./FavoritesDropdown";
import { Button } from "@/components/ui/button";
import { getUpcomingOccasions, GiftOccasion } from "./utils/upcomingOccasions";

const MarketplaceWrapper = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const productId = searchParams.get("productId");
  const { products, isLoading, loadProducts } = useProducts();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [showProductDetails, setShowProductDetails] = useState<string | null>(productId);
  const [upcomingOccasions, setUpcomingOccasions] = useState<GiftOccasion[]>([]);

  useEffect(() => {
    setUpcomingOccasions(getUpcomingOccasions());
  }, []);

  useEffect(() => {
    const keyword = searchParams.get("search") || "";
    setSearchTerm(keyword);
    loadProducts({ keyword: keyword });
  }, [searchParams])

  useEffect(() => {
    if (productId) {
      setShowProductDetails(productId);
    } else {
      setShowProductDetails(null);
    }
  }, [productId]);

  const selectedProduct = showProductDetails !== null 
    ? products.find(p => p.product_id === showProductDetails)
    : null;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header Section */}
      <div className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <FavoritesDropdown />
          </div>
          
          {/* Quick Navigation Links */}
          <div className="flex gap-6 mt-4 text-sm overflow-x-auto pb-2">
            {upcomingOccasions.map((occasion, index) => (
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

      <div className="container mx-auto px-4 pt-6">
        <MarketplaceContent 
          products={products}
          isLoading={isLoading}
          searchTerm={searchTerm}
        />
      </div>
      
      {/* <ProductDetailsDialog 
        productId={selectedProduct}
        open={showProductDetails !== null}
        onOpenChange={(open) => {
          if (!open) {
            const newParams = new URLSearchParams(searchParams);
            newParams.delete("productId");
            window.history.replaceState(
              {}, 
              '', 
              `${window.location.pathname}${newParams.toString() ? '?' + newParams.toString() : ''}`
            );
            setShowProductDetails(null);
          }
        }}
        userData={user}
      /> */}
    </div>
  );
};

export default MarketplaceWrapper;
