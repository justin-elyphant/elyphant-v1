
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import MarketplaceContent from "./MarketplaceContent";
import { useProducts } from "@/contexts/ProductContext";
import ProductDetailsDialog from "./product-details/ProductDetailsDialog";
import { useAuth } from "@/contexts/auth";
import FavoritesDropdown from "./FavoritesDropdown";
import { Button } from "@/components/ui/button";
import { getUpcomingOccasions, GiftOccasion } from "./utils/upcomingOccasions";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";

const MarketplaceWrapper = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const productId = searchParams.get("productId");
  const { products, isLoading, loadProducts } = useProducts();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [showProductDetails, setShowProductDetails] = useState<string | null>(productId);
  const [upcomingOccasions, setUpcomingOccasions] = useState<GiftOccasion[]>([]);
  const [showApiAlert, setShowApiAlert] = useState(true);

  useEffect(() => {
    setUpcomingOccasions(getUpcomingOccasions());
  }, []);

  useEffect(() => {
    const keyword = searchParams.get("search") || "";
    setSearchTerm(keyword);
    loadProducts({ keyword: keyword });
  }, [searchParams]);

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
    
  const goToTrunkline = () => {
    navigate("/trunkline");
  };

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
        {searchTerm && showApiAlert && (
          <Alert className="mb-4 bg-amber-50 border-amber-200">
            <AlertDescription className="flex justify-between items-center">
              <span>Using mock search results for demo purposes.</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setShowApiAlert(false)}>
                  Dismiss
                </Button>
                <Button size="sm" variant="default" onClick={goToTrunkline}>
                  Go to Trunkline
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <MarketplaceContent 
          products={products}
          isLoading={isLoading}
          searchTerm={searchTerm}
        />
      </div>
      
      {selectedProduct && (
        <ProductDetailsDialog 
          productId={selectedProduct.product_id || ""}
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
        />
      )}
    </div>
  );
};

export default MarketplaceWrapper;
