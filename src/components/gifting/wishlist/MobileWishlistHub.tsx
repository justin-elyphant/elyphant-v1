import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Search, X, Plus, Heart, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Wishlist } from "@/types/profile";
import CompactProfileHeader from "./CompactProfileHeader";
import MobileWishlistCard from "./MobileWishlistCard";
import CreateWishlistCard from "./CreateWishlistCard";
import { useProducts, Product } from "@/contexts/ProductContext";
import { useUnifiedSearch } from "@/hooks/useUnifiedSearch";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import AirbnbStyleProductCard from "@/components/marketplace/AirbnbStyleProductCard";

type TabMode = "wishlists" | "shop";

interface MobileWishlistHubProps {
  wishlists: Wishlist[];
  onCreateWishlist: () => void;
  onEditWishlist: (id: string) => void;
  onDeleteWishlist: (id: string) => void;
}

const MobileWishlistHub: React.FC<MobileWishlistHubProps> = ({
  wishlists,
  onCreateWishlist,
  onEditWishlist,
  onDeleteWishlist
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabMode>("wishlists");
  const [searchQuery, setSearchQuery] = useState("");
  const [recentSearches] = useState<string[]>(["Nike", "AirPods", "Lego", "Skincare"]);
  
  // Product search
  const { products, isLoading: productsLoading } = useProducts();
  const { searchProducts, isLoading: searchLoading } = useUnifiedSearch({ debounceMs: 300 });
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Detect search intent: product search vs wishlist filter
  const isProductSearch = useMemo(() => {
    if (!searchQuery.trim()) return false;
    // Check if query matches any wishlist names
    const matchesWishlist = wishlists.some(w => 
      w.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return !matchesWishlist;
  }, [searchQuery, wishlists]);

  // Filter wishlists based on search
  const filteredWishlists = useMemo(() => {
    if (!searchQuery.trim()) return wishlists;
    const query = searchQuery.toLowerCase();
    return wishlists.filter(w => 
      w.title.toLowerCase().includes(query) ||
      w.description?.toLowerCase().includes(query)
    );
  }, [wishlists, searchQuery]);

  // Handle search input
  const handleSearchChange = async (value: string) => {
    setSearchQuery(value);
    
    // If it looks like a product search, fetch results
    if (value.trim() && !wishlists.some(w => w.title.toLowerCase().includes(value.toLowerCase()))) {
      const results = await searchProducts(value);
      setSearchResults(results);
      setActiveTab("shop"); // Auto-switch to shop tab
    } else {
      setSearchResults([]);
      if (!value.trim()) {
        setActiveTab("wishlists");
      }
    }
  };

  // Handle recent search click
  const handleRecentSearchClick = (term: string) => {
    setSearchQuery(term);
    handleSearchChange(term);
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setActiveTab("wishlists");
  };

  // Products to display
  const displayProducts = searchQuery.trim() ? searchResults : products.slice(0, 8);
  const isLoadingProducts = searchQuery.trim() ? searchLoading : productsLoading;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Sticky Header Zone */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
        <div className="safe-area-top" />
        
        {/* Compact Profile Header */}
        <CompactProfileHeader 
          wishlists={wishlists}
          onCreateWishlist={onCreateWishlist}
          showGiftTracker={true}
        />

        {/* Dual-Purpose Search Bar */}
        <div className="px-4 py-3 border-b border-border/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products or wishlists..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 pr-10 h-11 rounded-xl bg-muted/50 border-0 focus:bg-background focus:ring-2 focus:ring-primary/20 text-base"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 rounded-full"
                onClick={clearSearch}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Recent Searches Pills */}
          {!searchQuery && recentSearches.length > 0 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1 -mx-1 px-1">
              {recentSearches.map((term) => (
                <Badge
                  key={term}
                  variant="outline"
                  className="cursor-pointer whitespace-nowrap rounded-full px-3 py-1 text-xs hover:bg-muted/50 flex-shrink-0"
                  onClick={() => handleRecentSearchClick(term)}
                >
                  {term}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Tab Toggle */}
        <div className="px-4 py-2 border-b border-border/30">
          <div className="flex bg-muted/50 rounded-xl p-1">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "flex-1 h-9 rounded-lg text-sm font-medium transition-all gap-2",
                activeTab === "wishlists"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setActiveTab("wishlists")}
            >
              <Heart className="h-4 w-4" />
              My Wishlists
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "flex-1 h-9 rounded-lg text-sm font-medium transition-all gap-2",
                activeTab === "shop"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setActiveTab("shop")}
            >
              <ShoppingBag className="h-4 w-4" />
              Shop to Add
            </Button>
          </div>
        </div>
      </div>

      {/* Content Zone */}
      <div 
        className="flex-1 overflow-y-auto"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div 
          className="px-4 py-4"
          style={{ 
            paddingBottom: 'max(6rem, calc(env(safe-area-inset-bottom, 0px) + 6rem))' 
          }}
        >
          {/* My Wishlists Tab */}
          {activeTab === "wishlists" && (
            <div className="space-y-4">
              {/* Search results info */}
              {searchQuery && (
                <p className="text-sm text-muted-foreground">
                  {filteredWishlists.length} {filteredWishlists.length === 1 ? 'wishlist' : 'wishlists'} found
                </p>
              )}

              {/* Wishlists Grid */}
              {filteredWishlists.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {filteredWishlists.map((wishlist) => (
                    <MobileWishlistCard
                      key={wishlist.id}
                      wishlist={wishlist}
                      onEdit={onEditWishlist}
                      onDelete={onDeleteWishlist}
                    />
                  ))}
                </div>
              ) : wishlists.length === 0 ? (
                /* Empty State - First Wishlist CTA */
                <div className="pt-8">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600/20 to-sky-500/20 flex items-center justify-center mx-auto mb-4">
                      <Heart className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Start Your First Wishlist</h3>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                      Create wishlists and share them with friends and family for any occasion.
                    </p>
                  </div>
                  <Button 
                    onClick={onCreateWishlist}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-purple-600 to-sky-500 hover:from-purple-700 hover:to-sky-600"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Create Your First Wishlist
                  </Button>
                </div>
              ) : (
                /* No results for search */
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">No wishlists match "{searchQuery}"</p>
                  <Button variant="outline" onClick={clearSearch} className="rounded-xl">
                    Clear Search
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Shop Tab */}
          {activeTab === "shop" && (
            <div className="space-y-4">
              {/* Search context */}
              {searchQuery && (
                <p className="text-sm text-muted-foreground">
                  {isLoadingProducts ? "Searching..." : `${displayProducts.length} products found for "${searchQuery}"`}
                </p>
              )}

              {/* Products Grid */}
              {displayProducts.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {displayProducts.map((product: any) => (
                    <AirbnbStyleProductCard
                      key={product.product_id || product.id}
                      product={product}
                      onProductClick={() => navigate(`/product/${product.product_id || product.id}`)}
                      context="wishlist"
                    />
                  ))}
                </div>
              ) : !isLoadingProducts && (
                <div className="text-center py-12">
                  <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">Find Products to Add</h3>
                  <p className="text-sm text-muted-foreground">
                    Search for products above to add them to your wishlists
                  </p>
                </div>
              )}

              {/* Loading state */}
              {isLoadingProducts && (
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="aspect-square bg-muted/50 rounded-xl animate-pulse" />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileWishlistHub;
