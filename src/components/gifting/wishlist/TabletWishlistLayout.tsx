import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Search, X, Plus, SlidersHorizontal, Grid3X3, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Wishlist } from "@/types/profile";
import CompactProfileHeader from "./CompactProfileHeader";
import WishlistCard from "./WishlistCard";
import CreateWishlistCard from "./CreateWishlistCard";
import ShoppingHeroSection from "./ShoppingHeroSection";
import MarketplaceProductsSection from "./MarketplaceProductsSection";
import { useProducts } from "@/contexts/ProductContext";
import { useUnifiedSearch } from "@/hooks/useUnifiedSearch";

type ViewMode = "grid" | "list";
type SortOption = "recent" | "name" | "items" | "updated";

interface TabletWishlistLayoutProps {
  wishlists: Wishlist[];
  onCreateWishlist: () => void;
  onEditWishlist: (id: string) => void;
  onDeleteWishlist: (id: string) => void;
}

const TabletWishlistLayout: React.FC<TabletWishlistLayoutProps> = ({
  wishlists,
  onCreateWishlist,
  onEditWishlist,
  onDeleteWishlist
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  // Product search
  const { products, isLoading: productsLoading } = useProducts();
  const { searchProducts, isLoading: searchLoading } = useUnifiedSearch({ debounceMs: 300 });
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isProductSearch, setIsProductSearch] = useState(false);

  // Extract categories
  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    wishlists.forEach(w => {
      if (w.category) categories.add(w.category);
    });
    return Array.from(categories);
  }, [wishlists]);

  // Sort options
  const sortOptions = [
    { value: "recent" as const, label: "Recently Added" },
    { value: "name" as const, label: "Name A-Z" },
    { value: "items" as const, label: "Most Items" },
    { value: "updated" as const, label: "Last Updated" }
  ];

  // Filter and sort wishlists
  const filteredAndSortedWishlists = useMemo(() => {
    let filtered = wishlists.filter(wishlist => {
      if (categoryFilter && wishlist.category !== categoryFilter) {
        return false;
      }
      if (searchQuery && !isProductSearch) {
        const query = searchQuery.toLowerCase();
        return (
          wishlist.title.toLowerCase().includes(query) ||
          wishlist.description?.toLowerCase().includes(query)
        );
      }
      return true;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.title.localeCompare(b.title);
        case "items":
          return (b.items?.length || 0) - (a.items?.length || 0);
        case "updated":
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        case "recent":
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
  }, [wishlists, categoryFilter, searchQuery, sortBy, isProductSearch]);

  // Handle search
  const handleSearchChange = async (value: string) => {
    setSearchQuery(value);
    
    // Detect if this is a product search (doesn't match wishlist names)
    const matchesWishlist = wishlists.some(w => 
      w.title.toLowerCase().includes(value.toLowerCase())
    );
    
    if (value.trim() && !matchesWishlist) {
      setIsProductSearch(true);
      const results = await searchProducts(value);
      setSearchResults(results);
    } else {
      setIsProductSearch(false);
      setSearchResults([]);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setCategoryFilter(null);
    setIsProductSearch(false);
    setSearchResults([]);
  };

  const activeFiltersCount = [
    searchQuery.length > 0,
    categoryFilter !== null
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Compact Profile Header */}
      <CompactProfileHeader 
        wishlists={wishlists}
        onCreateWishlist={onCreateWishlist}
        showGiftTracker={true}
        className="sticky top-0 z-40"
      />

      {/* Search & Controls Bar */}
      <div className="sticky top-[72px] z-30 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="px-6 py-4">
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search wishlists or products..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 pr-10 h-10 rounded-xl bg-muted/50 border-0 focus:bg-background focus:ring-2 focus:ring-primary/20"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 rounded-full"
                  onClick={clearFilters}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex bg-muted/50 rounded-lg p-1">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 px-3 rounded-md",
                  viewMode === "grid" ? "bg-background shadow-sm" : ""
                )}
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 px-3 rounded-md",
                  viewMode === "list" ? "bg-background shadow-sm" : ""
                )}
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            {/* Filter Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="h-10 rounded-lg">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px]">
                <SheetHeader>
                  <SheetTitle>Filter & Sort</SheetTitle>
                </SheetHeader>
                <div className="py-6 space-y-6">
                  {/* Sort Options */}
                  <div>
                    <h3 className="font-medium mb-3">Sort By</h3>
                    <div className="space-y-2">
                      {sortOptions.map(option => (
                        <Button
                          key={option.value}
                          variant={sortBy === option.value ? "default" : "outline"}
                          className="w-full justify-start"
                          onClick={() => setSortBy(option.value)}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Categories */}
                  {availableCategories.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-3">Categories</h3>
                      <div className="flex flex-wrap gap-2">
                        <Badge
                          variant={categoryFilter === null ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => setCategoryFilter(null)}
                        >
                          All
                        </Badge>
                        {availableCategories.map(cat => (
                          <Badge
                            key={cat}
                            variant={categoryFilter === cat ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => setCategoryFilter(cat)}
                          >
                            {cat}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Active Filters */}
        {activeFiltersCount > 0 && (
          <div className="px-6 pb-3 flex gap-2">
            {categoryFilter && (
              <Badge variant="secondary" className="rounded-full">
                {categoryFilter}
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-1 h-auto p-0"
                  onClick={() => setCategoryFilter(null)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="px-6 py-6">
        {/* Product Search Results */}
        {isProductSearch && searchResults.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Products for "{searchQuery}"</h2>
            <MarketplaceProductsSection
              products={searchResults}
              wishlists={wishlists}
              onCreateWishlist={onCreateWishlist}
              isLoading={searchLoading}
              mode="browse"
              title={`Products for "${searchQuery}"`}
            />
          </div>
        )}

        {/* Wishlists Section */}
        <div>
          {!isProductSearch && (
            <h2 className="text-xl font-semibold mb-4">
              {searchQuery ? `Wishlists matching "${searchQuery}"` : "Your Wishlists"}
            </h2>
          )}

          {filteredAndSortedWishlists.length > 0 ? (
            <div className={cn(
              viewMode === "grid" 
                ? "grid grid-cols-2 gap-4" 
                : "space-y-4"
            )}>
              {filteredAndSortedWishlists.map((wishlist) => (
                <WishlistCard
                  key={wishlist.id}
                  wishlist={wishlist}
                  onEdit={onEditWishlist}
                  onDelete={onDeleteWishlist}
                />
              ))}
            </div>
          ) : wishlists.length === 0 ? (
            <div className="flex justify-center py-12">
              <CreateWishlistCard onCreateNew={onCreateWishlist} />
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No wishlists match your filters</p>
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TabletWishlistLayout;
