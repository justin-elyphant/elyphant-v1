import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { X, Search, Sparkles } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useProducts } from "@/contexts/ProductContext";
import { Product } from "@/contexts/ProductContext";
import { useWishlist } from "@/components/gifting/hooks/useWishlist";
import { toast } from "sonner";
import { useMarketplace } from "@/hooks/useMarketplace";
import TrendingSection from "./TrendingSection";
import { WishlistItem } from "@/types/profile";
import { productCatalogService } from "@/services/ProductCatalogService";
import AirbnbStyleProductCard from "@/components/marketplace/AirbnbStyleProductCard";


interface ShoppingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  wishlistId: string;
  onProductAdded?: (product: any) => void;
}

const ShoppingPanel = ({
  isOpen,
  onClose,
  wishlistId,
  onProductAdded
}: ShoppingPanelProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const { products } = useProducts();
  const { addToWishlist, isAdding } = useWishlist();
  const { executeSearch, isLoading: isSearching } = useMarketplace();
  
  const [hasSearched, setHasSearched] = useState(false);
  const [localSearchResults, setLocalSearchResults] = useState<Product[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<WishlistItem[]>([]);
  const [isTrendingLoading, setIsTrendingLoading] = useState(false);

  // Fetch diverse trending products from Amazon
  useEffect(() => {
    const fetchTrendingProducts = async () => {
      if (!isOpen) return;
      
      setIsTrendingLoading(true);
      try {
        // Use productCatalogService for diverse product selection
        const response = await productCatalogService.searchProducts('', { category: 'best-selling', limit: 12 });
        
        if (!response.error && response.products) {
          // Deduplicate products by brand to ensure diversity
          const seenBrands = new Set<string>();
          const diverseProducts = response.products.filter((product: any) => {
            const brand = (product.brand || '').toLowerCase();
            // Skip if we already have this brand and we have enough products
            if (seenBrands.has(brand) && seenBrands.size >= 6) {
              return false;
            }
            seenBrands.add(brand);
            return true;
          }).slice(0, 6); // Take first 6 diverse products

          const transformedProducts: WishlistItem[] = diverseProducts.map((product: any) => ({
            id: product.product_id,
            product_id: product.product_id,
            name: product.title,
            title: product.title,
            brand: product.brand,
            price: product.price,
            image_url: product.image || product.main_image,
            wishlist_id: wishlistId,
            created_at: new Date().toISOString(),
            stars: product.stars || product.rating || 0,
            review_count: product.review_count || product.reviews || 0
          } as any));
          
          console.log('Trending products with diversity:', transformedProducts.map(p => `${p.brand} - ${p.name}`));
          setTrendingProducts(transformedProducts);
        }
      } catch (error) {
        console.error("Error fetching trending products:", error);
      } finally {
        setIsTrendingLoading(false);
      }
    };
    
    fetchTrendingProducts();
  }, [isOpen, wishlistId]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setHasSearched(true);
    const response = await executeSearch(searchQuery);
    
    // Store results in local state (modal shouldn't affect URL state)
    if (response && response.products) {
      setLocalSearchResults(response.products as Product[]);
    }
  };

  const handleProductClick = (product: Product) => {
    const productId = product.product_id || product.id;
    navigate(`/marketplace/product/${productId}`, {
      state: {
        product,
        context: 'shopping',
        recipientId: wishlistId,
        returnPath: location.pathname
      }
    });
    onClose(); // Close the shopping panel
  };

  const handleQuickAdd = async (product: Product) => {
    try {
      const wishlistItem = {
        name: product.name || product.title,
        title: product.title || product.name,
        price: product.price,
        image_url: product.image || (product as any).image_url,
        brand: product.brand,
        product_id: product.product_id || product.id,
        vendor: product.vendor,
        retailer: (product as any).retailer,
        product_source: (product as any).product_source || (product as any).productSource,
        isZincApiProduct: (product as any).isZincApiProduct
      };

      await addToWishlist(wishlistId, wishlistItem);
      toast.success(`Added ${product.name || product.title} to wishlist!`);
      
      
      if (onProductAdded) {
        onProductAdded(wishlistItem);
      }
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      toast.error("Failed to add item to wishlist");
    }
  };

  const displayProducts = hasSearched ? localSearchResults : products.slice(0, 20);

  const content = (
    <div className="flex flex-col h-full">
      {/* Search Section - Sticky */}
      <div className="p-4 border-b border-border sticky top-0 bg-background z-10">
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products and brands"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch} disabled={isSearching}>
            {isSearching ? "Searching..." : "Search"}
          </Button>
        </div>

        {!hasSearched && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            <span>Showing trending products. Search to find specific items.</span>
          </div>
        )}
      </div>

      {/* Unified Scroll Area */}
      <div className="flex-1 overflow-y-auto">
        {/* Trending Section - Only show if not searched */}
        {!hasSearched && !isTrendingLoading && trendingProducts.length > 0 && (
          <div className="px-4 pt-4">
            <TrendingSection 
              items={trendingProducts}
              onQuickAdd={handleQuickAdd}
              onProductClick={handleProductClick}
            />
          </div>
        )}

        {/* Products List/Results */}
        <div className="p-4">
          {displayProducts.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="bg-muted/50 p-6 rounded-full inline-flex mb-4">
                <Search className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {hasSearched ? "No products found" : "Loading products..."}
              </h3>
              <p className="text-muted-foreground">
                {hasSearched ? "Try a different search term or browse trending products." : "Please wait while we load products for you."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {displayProducts.map((product) => (
                <AirbnbStyleProductCard
                  key={product.id || product.product_id}
                  product={product}
                  onProductClick={() => handleProductClick(product)}
                  context="wishlist"
                  viewMode="list"
                  onAddToCart={handleQuickAdd}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="h-[90vh]">
          <DrawerHeader className="border-b border-border">
            <div className="flex items-center justify-between">
              <DrawerTitle>Add Items to Wishlist</DrawerTitle>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:w-[600px] p-0 flex flex-col">
        <SheetHeader className="p-6 border-b border-border">
          <SheetTitle>Add Items to Wishlist</SheetTitle>
        </SheetHeader>
        {content}
      </SheetContent>
    </Sheet>
  );
};

export default ShoppingPanel;
