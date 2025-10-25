import React, { useState, useEffect } from "react";
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
import QuickAddButton from "./QuickAddButton";
import { useUnifiedSearch } from "@/hooks/useUnifiedSearch";
import RecentlyAddedSection from "./RecentlyAddedSection";
import { WishlistItem } from "@/types/profile";
import { supabase } from "@/integrations/supabase/client";

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
  const [searchQuery, setSearchQuery] = useState("");
  const { products } = useProducts();
  const { addToWishlist, isAdding } = useWishlist();
  const { search, isLoading: isSearching, results } = useUnifiedSearch();
  
  const [hasSearched, setHasSearched] = useState(false);
  const [recentlyAdded, setRecentlyAdded] = useState<WishlistItem[]>([]);

  // Fetch recently added items for this wishlist
  useEffect(() => {
    const fetchRecentItems = async () => {
      if (!wishlistId || !isOpen) return;
      
      try {
        const { data, error } = await supabase
          .from('wishlist_items')
          .select('*')
          .eq('wishlist_id', wishlistId)
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (error) throw error;
        
        if (data) {
          const items: WishlistItem[] = data.map(item => ({
            id: item.id,
            wishlist_id: item.wishlist_id,
            product_id: item.product_id,
            name: item.name,
            title: item.title || item.name,
            brand: item.brand,
            price: item.price,
            image_url: item.image_url,
            added_at: item.created_at,
            created_at: item.created_at
          }));
          setRecentlyAdded(items);
        }
      } catch (error) {
        console.error("Error fetching recent items:", error);
      }
    };
    
    fetchRecentItems();
  }, [wishlistId, isOpen]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setHasSearched(true);
    await search(searchQuery);
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
      
      // Update recently added list
      setRecentlyAdded(prev => [wishlistItem as WishlistItem, ...prev].slice(0, 5));
      
      if (onProductAdded) {
        onProductAdded(wishlistItem);
      }
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      toast.error("Failed to add item to wishlist");
    }
  };

  const displayProducts = hasSearched ? (results.products || []) : products.slice(0, 20);

  const content = (
    <div className="flex flex-col h-full">
      {/* Search Section */}
      <div className="p-4 border-b border-border">
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for products..."
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

      {/* Recently Added Section */}
      {recentlyAdded.length > 0 && (
        <div className="px-4 pt-4">
          <RecentlyAddedSection items={recentlyAdded} />
        </div>
      )}

      {/* Products Grid */}
      <div className="flex-1 overflow-y-auto p-4">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {displayProducts.map((product) => (
              <div 
                key={product.id || product.product_id} 
                className="border border-border rounded-lg p-3 hover:shadow-md transition-shadow"
              >
                <div className="aspect-square bg-muted rounded-md overflow-hidden mb-3">
                  <img
                    src={product.image || (product as any).image_url || "/placeholder.svg"}
                    alt={product.name || product.title || "Product"}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <p className="text-xs text-muted-foreground mb-1">
                  {product.brand || "Unknown Brand"}
                </p>
                <h3 className="font-medium text-sm mb-2 line-clamp-2 min-h-[2.5rem]">
                  {product.name || product.title || "Unnamed Product"}
                </h3>
                
                <div className="flex items-center justify-between">
                  <p className="font-bold">${product.price?.toFixed(2) || "0.00"}</p>
                  <QuickAddButton
                    product={product}
                    onAdd={() => handleQuickAdd(product)}
                    isAdding={isAdding}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
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
