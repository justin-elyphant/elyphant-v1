import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import WishlistHeader from "./wishlist/WishlistHeader";
import CreateWishlistCard from "./wishlist/CreateWishlistCard";
import WishlistCard from "./wishlist/WishlistCard";
import CreateWishlistDialog from "./wishlist/CreateWishlistDialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import EditWishlistDialog from "./wishlist/EditWishlistDialog";
import { Wishlist } from "@/types/profile";
import { useWishlists } from "./hooks/useWishlists";
import { Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/auth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import SignInPrompt from "./my-wishlists/SignInPrompt";
import LoadingWishlists from "./my-wishlists/LoadingWishlists";
import InitErrorState from "./my-wishlists/InitErrorState";

// Form schema for validation (keep consistent with dialog components)
const wishlistFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  priority: z.enum(["low", "medium", "high"]).optional()
});

type WishlistFormValues = z.infer<typeof wishlistFormSchema>;

const MyWishlists = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentWishlist, setCurrentWishlist] = useState<Wishlist | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  
  // Use new hook for wishlists
  const {
    wishlists,
    isLoading,
    error,
    fetchWishlists,
    createWishlist,
    deleteWishlist,
    addToWishlist,
    removeFromWishlist,
  } = useWishlists();

  // Defensive: compute list of unique, valid, non-empty string categories
  const categories = React.useMemo(() => {
    if (!wishlists?.length) return [];
    const allCategories = wishlists
      .map(list => typeof list.category === "string" ? list.category.trim() : "")
      .filter((category) => typeof category === "string" && category.trim().length > 0);
    // Only unique valid (non-empty) strings
    return Array.from(new Set(allCategories));
  }, [wishlists]);

  // Debug log just before rendering to catch issues
  useEffect(() => {
    console.log("[Wishlist] Categories about to render in Select:", categories);
    // Show all wishlists and their categories for deeper debugging
    if (wishlists?.some(list => !list.category || typeof list.category !== "string" || list.category.trim() === "")) {
      console.warn("[Wishlist] Some wishlists have invalid categories:", wishlists.map(l => l.category));
    }
  }, [categories, wishlists]);

  // Filter wishlists based on category and search query
  const filteredWishlists = React.useMemo(() => {
    if (!wishlists) return [];
    
    return wishlists.filter(wishlist => {
      // Filter by category if selected
      if (categoryFilter && wishlist.category !== categoryFilter) {
        return false;
      }
      
      // Filter by search query if present
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = wishlist.title.toLowerCase().includes(query);
        const matchesDescription = wishlist.description?.toLowerCase().includes(query) || false;
        const matchesTags = wishlist.tags?.some(tag => tag.toLowerCase().includes(query)) || false;
        
        return matchesTitle || matchesDescription || matchesTags;
      }
      
      return true;
    });
  }, [wishlists, categoryFilter, searchQuery]);

  const handleCreateWishlist = () => {
    setDialogOpen(true);
  };

  const handleDialogSubmit = async (values: WishlistFormValues) => {
    await createWishlist(
      values.title, 
      values.description || "", 
      values.category, 
      values.tags,
      values.priority as "low" | "medium" | "high" | undefined
    );
    setDialogOpen(false);
  };

  const handleEditWishlist = (id: string) => {
    console.log(`Edit wishlist ${id}`);
    const wishlistToEdit = wishlists.find(wishlist => wishlist.id === id);
    if (wishlistToEdit) {
      setCurrentWishlist(wishlistToEdit);
      setEditDialogOpen(true);
    }
  };

  const handleEditDialogSubmit = async (values: WishlistFormValues) => {
    if (!currentWishlist) return;
    
    // For now, we'll just show a toast that this feature is coming soon
    toast.info("Wishlist editing will be available soon!");
    setEditDialogOpen(false);
  };

  const handleDeleteWishlist = (id: string) => {
    const wishlistToDelete = wishlists.find(wishlist => wishlist.id === id);
    if (wishlistToDelete) {
      setCurrentWishlist(wishlistToDelete);
      setDeleteDialogOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (currentWishlist) {
      try {
        setDeleting(true);
        await deleteWishlist(currentWishlist.id);
        setDeleteDialogOpen(false);
      } catch (error) {
        console.error("Error deleting wishlist:", error);
      } finally {
        setDeleting(false);
      }
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchWishlists();
      toast.success("Wishlists refreshed");
    } catch (error) {
      console.error("Error refreshing wishlists:", error);
      toast.error("Failed to refresh wishlists");
    } finally {
      setRefreshing(false);
    }
  };

  const clearFilters = () => {
    setCategoryFilter(null);
    setSearchQuery("");
  };

  // If not authenticated, show a sign-in prompt
  if (!user && !isLoading) {
    return <SignInPrompt />;
  }

  // Show loading state
  if (isLoading) {
    return <LoadingWishlists />;
  }

  // Show error state with retry option
  if (error) {
    return (
      <InitErrorState refreshing={refreshing} onRetry={fetchWishlists} />
    );
  }

  // Main content
  return (
    <div>
      <WishlistHeader onCreateNew={() => setDialogOpen(true)} />
      
      <Alert className="mb-6">
        <AlertDescription>
          Create wishlists for different occasions and share them with friends and family. Browse the marketplace to add items to your wishlists.
        </AlertDescription>
      </Alert>

      {/* Filter and search section */}
      {wishlists && wishlists.length > 1 && (
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="w-full sm:w-1/3">
            <Select
              value={categoryFilter || ""}
              onValueChange={(value) => setCategoryFilter(value || null)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                {/* This placeholder is correct */}
                <SelectItem value="">All Categories</SelectItem>
                {categories
                  // Even though categories are now fully sanitized, add one last filter
                  .filter(
                    (category): category is string =>
                      typeof category === "string" && category.trim().length > 0
                  )
                  .map((category, i) => (
                    <SelectItem
                      key={`${category}-${i}`}
                      value={category}
                    >
                      {category}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <div className="relative">
              <Input
                placeholder="Search wishlists..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
              {(categoryFilter || searchQuery) && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="absolute right-1 top-1 h-8"
                  onClick={clearFilters}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Empty state for filtered results */}
      {wishlists?.length > 0 && filteredWishlists.length === 0 && (
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center mb-6">
          <p className="text-muted-foreground mb-2">No wishlists match your filters</p>
          <Button variant="outline" onClick={clearFilters}>
            Clear Filters
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <CreateWishlistCard onCreateNew={() => setDialogOpen(true)} />
        
        {filteredWishlists && filteredWishlists.length > 0 ? (
          filteredWishlists.map((wishlist) => (
            <WishlistCard 
              key={wishlist.id}
              wishlist={wishlist}
              onEdit={handleEditWishlist}
              onDelete={handleDeleteWishlist}
            />
          ))
        ) : (
          wishlists?.length === 0 && (
            <div className="col-span-full py-8 text-center text-muted-foreground">
              No wishlists found. Create your first wishlist to get started!
            </div>
          )
        )}
      </div>

      <CreateWishlistDialog 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleDialogSubmit}
      />

      <EditWishlistDialog 
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSubmit={handleEditDialogSubmit}
        wishlist={currentWishlist}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this wishlist?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the wishlist "{currentWishlist?.title}" and all items within it.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              className="bg-red-600 hover:bg-red-700"
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MyWishlists;
