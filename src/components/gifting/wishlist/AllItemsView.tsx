import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";
import EnhancedWishlistCard from "./EnhancedWishlistCard";
import { Wishlist, WishlistItem } from "@/types/profile";
import { useWishlist } from "../hooks/useWishlist";
import { useProducts } from "@/contexts/ProductContext";
import ShoppingHeroSection from "./ShoppingHeroSection";
import MarketplaceProductsSection from "./MarketplaceProductsSection";
import RecentlyAddedSection from "./shopping/RecentlyAddedSection";
import CreateWishlistDialog from "./CreateWishlistDialog";
import ProfileSidebar from "./ProfileSidebar";

interface AllItemsViewProps {
  wishlists: Wishlist[];
  onCreateWishlist?: () => void;
}

type EnhancedWishlistItem = WishlistItem & {
  wishlistId: string;
  wishlistTitle: string;
};

const AllItemsView = ({ wishlists, onCreateWishlist }: AllItemsViewProps) => {
  const navigate = useNavigate();
  const { removeFromWishlist, createWishlist } = useWishlist();
  const { products, isLoading: productsLoading } = useProducts();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Aggregate all items from all wishlists
  const allItems = useMemo<EnhancedWishlistItem[]>(() => {
    const items: EnhancedWishlistItem[] = [];
    
    wishlists.forEach(wishlist => {
      wishlist.items.forEach(item => {
        items.push({
          ...item,
          wishlistId: wishlist.id,
          wishlistTitle: wishlist.title
        });
      });
    });
    
    return items;
  }, [wishlists]);

  // Extract unique categories from products and items
  const categories = useMemo(() => {
    const categorySet = new Set<string>();
    allItems.forEach(item => {
      if (item.brand) categorySet.add(item.brand);
    });
    products.forEach(product => {
      if (product.category) categorySet.add(product.category);
      if (product.brand) categorySet.add(product.brand);
    });
    return Array.from(categorySet).sort();
  }, [allItems, products]);

  // Recently added items (last 5)
  const recentlyAddedItems = useMemo(() => {
    return [...allItems]
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .slice(0, 5);
  }, [allItems]);

  // Filter items based on search and category
  const filteredItems = useMemo(() => {
    return allItems.filter(item => {
      // Category filter
      if (categoryFilter && item.brand !== categoryFilter) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = (item.name || item.title || "").toLowerCase().includes(query);
        const matchesBrand = (item.brand || "").toLowerCase().includes(query);
        const matchesWishlist = item.wishlistTitle.toLowerCase().includes(query);
        
        return matchesName || matchesBrand || matchesWishlist;
      }

      return true;
    });
  }, [allItems, categoryFilter, searchQuery]);

  // Filter marketplace products
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    
    return products.filter(product => {
      // Category filter
      if (categoryFilter && product.category !== categoryFilter && product.brand !== categoryFilter) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = (product.name || product.title || "").toLowerCase().includes(query);
        const matchesBrand = (product.brand || "").toLowerCase().includes(query);
        const matchesCategory = (product.category || "").toLowerCase().includes(query);
        
        return matchesName || matchesBrand || matchesCategory;
      }

      return true;
    });
  }, [products, categoryFilter, searchQuery]);

  const handleRemoveItem = async (item: EnhancedWishlistItem) => {
    try {
      setRemovingItemId(item.id);
      await removeFromWishlist(item.wishlistId, item.id);
    } catch (error) {
      console.error("Error removing item:", error);
    } finally {
      setRemovingItemId(null);
    }
  };

  const handleNavigateToWishlist = (wishlistId: string) => {
    navigate(`/wishlist/${wishlistId}`);
  };

  const handleCreateWishlist = async (values: { title: string; description?: string }) => {
    await createWishlist(values.title, values.description || "");
    setCreateDialogOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-purple-500/5 via-background to-pink-500/5">
      {/* Left Profile Sidebar */}
      <ProfileSidebar 
        wishlists={wishlists}
        categoryFilter={categoryFilter}
        onCategorySelect={setCategoryFilter}
        onCreateWishlist={onCreateWishlist}
      />
      
      {/* Main Content Area */}
      <div className="flex-1">
        {/* Hero Section */}
        <ShoppingHeroSection
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={categoryFilter}
          onCategorySelect={setCategoryFilter}
          categories={categories}
        />

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Recently Added Section */}
          {recentlyAddedItems.length > 0 && (
            <div className="py-6">
              <RecentlyAddedSection items={recentlyAddedItems} />
            </div>
          )}

          {/* Browse Products Section */}
          {filteredProducts.length > 0 && (
            <div className="py-6">
              <MarketplaceProductsSection
                products={filteredProducts}
                wishlists={wishlists}
                onCreateWishlist={() => setCreateDialogOpen(true)}
                isLoading={productsLoading}
              />
            </div>
          )}

          {/* Your Wishlist Items Section */}
          {filteredItems.length > 0 && (
            <div className="py-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-2xl font-bold">Your Wishlist Items</h2>
                  <Badge variant="secondary">
                    {filteredItems.length} items
                  </Badge>
                </div>
                {(searchQuery || categoryFilter) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("");
                      setCategoryFilter(null);
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {filteredItems.map((item) => (
                  <div key={`${item.wishlistId}-${item.id}`} className="relative">
                    {/* Wishlist Badge */}
                    <div 
                      className="absolute -top-2 left-2 z-10 cursor-pointer"
                      onClick={() => handleNavigateToWishlist(item.wishlistId)}
                    >
                      <Badge 
                        variant="outline" 
                        className="bg-background/95 backdrop-blur-sm hover:bg-primary/10 transition-colors text-xs"
                      >
                        {item.wishlistTitle}
                      </Badge>
                    </div>

                    <EnhancedWishlistCard
                      item={item}
                      onRemove={() => handleRemoveItem(item)}
                      isRemoving={removingItemId === item.id}
                      className="mt-4"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty States */}
          {filteredItems.length === 0 && allItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="bg-muted/50 p-6 rounded-full mb-6">
                <Package className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Your wishlists are empty</h3>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                Start browsing products above and add them to your wishlists with one click!
              </p>
            </div>
          )}
        </div>

        {/* Create Wishlist Dialog */}
        <CreateWishlistDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSubmit={handleCreateWishlist}
        />
      </div>
    </div>
  );
};

export default AllItemsView;
