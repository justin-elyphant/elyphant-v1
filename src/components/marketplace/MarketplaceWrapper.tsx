
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import MarketplaceContent from "./MarketplaceContent";
import { useProducts } from "@/contexts/ProductContext";
import ProductDetailsDialog from "./product-details/ProductDetailsDialog";
import { useAuth } from "@/contexts/auth";
import FavoritesDropdown from "./FavoritesDropdown";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

const MarketplaceWrapper = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const productId = searchParams.get("productId");
  const { products, isLoading } = useProducts();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  
  const [showProductDetails, setShowProductDetails] = useState<number | null>(
    productId ? parseInt(productId) : null
  );
  
  useEffect(() => {
    if (productId) {
      setShowProductDetails(parseInt(productId));
    } else {
      setShowProductDetails(null);
    }
  }, [productId]);
  
  const selectedProduct = showProductDetails !== null 
    ? products.find(p => p.id === showProductDetails)
    : null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchTerm) {
      params.set("search", searchTerm);
    } else {
      params.delete("search");
    }
    setSearchParams(params);
  };

  const clearSearch = () => {
    setSearchTerm("");
    const params = new URLSearchParams(searchParams);
    params.delete("search");
    setSearchParams(params);
  };
    
  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header Section */}
      <div className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <form onSubmit={handleSearch} className="flex-1 relative">
              <Input
                type="search"
                placeholder="Search for anything..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              {searchTerm && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                  onClick={clearSearch}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </form>
            <FavoritesDropdown />
          </div>
          
          {/* Quick Navigation Links */}
          <div className="flex gap-6 mt-4 text-sm">
            <Button variant="link" className="text-muted-foreground hover:text-foreground">
              Mother's Day Gifts
            </Button>
            <Button variant="link" className="text-muted-foreground hover:text-foreground">
              Home Favorites
            </Button>
            <Button variant="link" className="text-muted-foreground hover:text-foreground">
              Fashion Finds
            </Button>
            <Button variant="link" className="text-muted-foreground hover:text-foreground">
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
      
      <ProductDetailsDialog 
        product={selectedProduct}
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
    </div>
  );
};

export default MarketplaceWrapper;
