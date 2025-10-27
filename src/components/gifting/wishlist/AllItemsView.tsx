import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Home } from "lucide-react";
import EnhancedWishlistCard from "./EnhancedWishlistCard";
import { Wishlist, WishlistItem } from "@/types/profile";
import { useWishlist } from "../hooks/useWishlist";
import { useProducts } from "@/contexts/ProductContext";
import { useZincSearch } from "@/hooks/useZincSearch";
import ShoppingHeroSection from "./ShoppingHeroSection";
import MarketplaceProductsSection from "./MarketplaceProductsSection";
import RecentlyAddedSection from "./shopping/RecentlyAddedSection";
import CreateWishlistDialog from "./CreateWishlistDialog";
import ProfileSidebar from "./ProfileSidebar";
import { WishlistPurchaseTrackingService } from "@/services/wishlistPurchaseTracking";
import StandardBreadcrumb, { BreadcrumbItem } from "@/components/shared/StandardBreadcrumb";

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
  const [purchasedItems, setPurchasedItems] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'home' | 'shopping'>('home');
  const [aiSearchEnabled, setAiSearchEnabled] = useState(false);
  
  // Live search hook for marketplace products
  const { 
    loading: searchLoading, 
    zincResults, 
    filteredProducts: searchResults 
  } = useZincSearch(searchQuery);

  // Auto-switch view mode based on search/filter activity
  useEffect(() => {
    const isSearching = searchQuery.trim() !== "" || categoryFilter !== null;
    setViewMode(isSearching ? 'shopping' : 'home');
  }, [searchQuery, categoryFilter]);

  // Fetch purchased items status
  useEffect(() => {
    const fetchPurchases = async () => {
      if (wishlists.length === 0) return;
      
      try {
        const wishlistIds = wishlists.map(w => w.id);
        const results = await Promise.all(
          wishlistIds.map(id => WishlistPurchaseTrackingService.getWishlistPurchases(id))
        );
        
        const purchased = new Set<string>();
        results.forEach(result => {
          result.purchases?.forEach(p => purchased.add(p.item_id));
        });
        
        setPurchasedItems(purchased);
        console.log(`✅ Loaded purchase status for ${purchased.size} items`);
      } catch (error) {
        console.error('Failed to fetch purchase status:', error);
      }
    };
    
    fetchPurchases();
  }, [wishlists]);

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

  // Determine which products to show based on search/filter state
  const displayProducts = useMemo(() => {
    // If searching, prioritize live search results
    if (searchQuery.trim()) {
      const results = searchResults.length > 0 ? searchResults : zincResults;
      
      // Apply category filter if set
      if (categoryFilter) {
        return results.filter(product => 
          product.category === categoryFilter || product.brand === categoryFilter
        );
      }
      
      return results;
    }
    
    // If only category filter (no search), filter ProductContext products
    if (categoryFilter) {
      return products.filter(product => 
        product.category === categoryFilter || product.brand === categoryFilter
      );
    }
    
    // Default: show ProductContext products
    return products;
  }, [searchQuery, searchResults, zincResults, categoryFilter, products]);
  
  // Determine loading state
  const isSearching = searchQuery.trim() !== "";
  const showLoading = isSearching ? searchLoading : productsLoading;

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

  const handleClearFilters = () => {
    setSearchQuery("");
    setCategoryFilter(null);
    setAiSearchEnabled(false);
  };

  const handleAISearchToggle = (enabled: boolean) => {
    setAiSearchEnabled(enabled);
    if (!enabled) {
      // Switching back to standard search
      console.log("Switched to standard search mode");
    } else {
      console.log("Switched to AI search mode");
    }
  };

  const handleAISearch = () => {
    if (!searchQuery.trim()) return;
    
    // Navigate to marketplace with AI context
    const marketplaceUrl = new URL('/marketplace', window.location.origin);
    marketplaceUrl.searchParams.set('search', searchQuery.trim());
    marketplaceUrl.searchParams.set('source', 'nicole');
    marketplaceUrl.searchParams.set('mode', 'nicole');
    
    console.log(`🤖 AI Search triggered for: "${searchQuery.trim()}"`);
    navigate(marketplaceUrl.pathname + marketplaceUrl.search);
  };

  // Build breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "My Wishlists", href: "/wishlists", isCurrentPage: viewMode === 'home' }
  ];

  if (viewMode === 'shopping') {
    if (searchQuery) {
      breadcrumbItems.push({ 
        label: `Search: "${searchQuery}"`, 
        isCurrentPage: true 
      });
    } else if (categoryFilter) {
      breadcrumbItems.push({ 
        label: `Category: ${categoryFilter}`, 
        isCurrentPage: true 
      });
    }
  }

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
        {/* Hero Section with Sticky Behavior */}
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border/50">
          <ShoppingHeroSection
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={categoryFilter}
            onCategorySelect={setCategoryFilter}
            categories={categories}
            viewMode={viewMode}
            onClearFilters={handleClearFilters}
            aiSearchEnabled={aiSearchEnabled}
            onAISearchToggle={handleAISearchToggle}
            onAISearch={handleAISearch}
          />
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb Navigation */}
          <div className="pt-4">
            <StandardBreadcrumb items={breadcrumbItems} />
          </div>
          {/* HOME MODE: Personal Content First */}
          {viewMode === 'home' && (
            <>
              {/* Recently Added Section */}
              {recentlyAddedItems.length > 0 && (
                <div className="py-6">
                  <RecentlyAddedSection items={recentlyAddedItems} />
                </div>
              )}

              {/* Your Wishlist Items Section - Prominent */}
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
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {filteredItems.map((item) => (
                      <div key={`${item.wishlistId}-${item.id}`} className="relative">
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
                          isPurchased={purchasedItems.has(item.id)}
                          className="mt-4"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Products - Show top 8 */}
              {products.length > 0 && (
                <div className="py-6">
                  <MarketplaceProductsSection
                    products={products.slice(0, 8)}
                    wishlists={wishlists}
                    onCreateWishlist={() => setCreateDialogOpen(true)}
                    isLoading={productsLoading}
                    mode="recommended"
                    title="Recommended for You"
                  />
                </div>
              )}
            </>
          )}

          {/* SHOPPING MODE: Discovery Content First */}
          {viewMode === 'shopping' && (
            <>
              {/* Browse Products Section - Prominent */}
              <div className="py-6" id="browse-products">
                <MarketplaceProductsSection
                  products={displayProducts}
                  wishlists={wishlists}
                  onCreateWishlist={() => setCreateDialogOpen(true)}
                  isLoading={showLoading}
                  mode="browse"
                />
              </div>

              {/* Recently Added - Compact Horizontal */}
              {recentlyAddedItems.length > 0 && (
                <div className="py-6 border-t border-border">
                  <RecentlyAddedSection items={recentlyAddedItems} />
                </div>
              )}

              {/* Your Wishlist Items Section - Compact */}
              {filteredItems.length > 0 && (
                <div className="py-6 border-t border-border">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold">In Your Wishlists</h3>
                      <Badge variant="secondary" className="text-xs">
                        {filteredItems.length}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {filteredItems.map((item) => (
                      <div key={`${item.wishlistId}-${item.id}`} className="relative">
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
                          isPurchased={purchasedItems.has(item.id)}
                          className="mt-4"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
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
