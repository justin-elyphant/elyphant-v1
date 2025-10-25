import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal, Package } from "lucide-react";
import EnhancedWishlistCard from "./EnhancedWishlistCard";
import { Wishlist, WishlistItem } from "@/types/profile";
import { useWishlist } from "../hooks/useWishlist";

interface AllItemsViewProps {
  wishlists: Wishlist[];
}

type EnhancedWishlistItem = WishlistItem & {
  wishlistId: string;
  wishlistTitle: string;
};

const AllItemsView = ({ wishlists }: AllItemsViewProps) => {
  const navigate = useNavigate();
  const { removeFromWishlist } = useWishlist();
  const [searchQuery, setSearchQuery] = useState("");
  const [wishlistFilter, setWishlistFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);

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

  // Extract unique categories
  const categories = useMemo(() => {
    const categorySet = new Set<string>();
    allItems.forEach(item => {
      if (item.brand) categorySet.add(item.brand);
    });
    return Array.from(categorySet).sort();
  }, [allItems]);

  // Filter items based on search, wishlist, and category
  const filteredItems = useMemo(() => {
    return allItems.filter(item => {
      // Wishlist filter
      if (wishlistFilter !== "all" && item.wishlistId !== wishlistFilter) {
        return false;
      }

      // Category filter
      if (categoryFilter !== "all" && item.brand !== categoryFilter) {
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
  }, [allItems, wishlistFilter, categoryFilter, searchQuery]);

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

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-2xl font-bold">All Items</h2>
          <Badge variant="secondary" className="ml-2">
            {filteredItems.length} items
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search items, brands, or wishlists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={wishlistFilter} onValueChange={setWishlistFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            <SelectValue placeholder="All Wishlists" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Wishlists</SelectItem>
            {wishlists.map(wishlist => (
              <SelectItem key={wishlist.id} value={wishlist.id}>
                {wishlist.title} ({wishlist.items.length})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(category => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Clear Filters */}
      {(searchQuery || wishlistFilter !== "all" || categoryFilter !== "all") && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {filteredItems.length} of {allItems.length} items
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setWishlistFilter("all");
              setCategoryFilter("all");
            }}
          >
            Clear Filters
          </Button>
        </div>
      )}

      {/* Items Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <div key={`${item.wishlistId}-${item.id}`} className="relative">
              {/* Wishlist Badge */}
              <div 
                className="absolute -top-2 left-2 z-10 cursor-pointer"
                onClick={() => handleNavigateToWishlist(item.wishlistId)}
              >
                <Badge 
                  variant="outline" 
                  className="bg-background/95 backdrop-blur-sm hover:bg-primary/10 transition-colors"
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
      ) : (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="bg-muted/50 p-6 rounded-full mb-6">
            <Package className="h-12 w-12 text-muted-foreground" />
          </div>
          
          {searchQuery || wishlistFilter !== "all" || categoryFilter !== "all" ? (
            <>
              <h3 className="text-xl font-semibold mb-2">No items found</h3>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                No items match your current filters. Try adjusting your search or filters.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setWishlistFilter("all");
                  setCategoryFilter("all");
                }}
              >
                Clear All Filters
              </Button>
            </>
          ) : allItems.length === 0 && wishlists.length > 0 ? (
            <>
              <h3 className="text-xl font-semibold mb-2">Your wishlists are empty</h3>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                Start adding items to your wishlists to see them here. Browse the marketplace or use the shopping panel to add items.
              </p>
              <Button onClick={() => navigate("/marketplace")}>
                Browse Marketplace
              </Button>
            </>
          ) : (
            <>
              <h3 className="text-xl font-semibold mb-2">No wishlists yet</h3>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                Create your first wishlist to start organizing your favorite items.
              </p>
              <Button onClick={() => navigate("/wishlists")}>
                Create Your First Wishlist
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AllItemsView;
