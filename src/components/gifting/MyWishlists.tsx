import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import CreateWishlistCard from "./wishlist/CreateWishlistCard";
import WishlistCard from "./wishlist/WishlistCard";
import CreateWishlistDialog from "./wishlist/CreateWishlistDialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import EditWishlistDialog from "./wishlist/EditWishlistDialog";
import { Wishlist } from "@/types/profile";
import { useUnifiedWishlistSystem } from "@/hooks/useUnifiedWishlistSystem";
import { Loader2 } from "lucide-react";
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
import { z } from "zod";
import SignInPrompt from "./my-wishlists/SignInPrompt";
import LoadingWishlists from "./my-wishlists/LoadingWishlists";
import InitErrorState from "./my-wishlists/InitErrorState";
import { getValidWishlistCategories, sanitizeCategories } from "./wishlist/utils/categoryUtils";
import PinterestStyleWishlistGrid from "./wishlist/PinterestStyleWishlistGrid";
import ContextualWishlistActions from "./wishlist/ContextualWishlistActions";
import EnhancedWishlistHeader from "./wishlist/EnhancedWishlistHeader";
import TagBasedRecommendations from "./wishlist/TagBasedRecommendations";
import MobileWishlistLayout from "./wishlist/MobileWishlistLayout";
import MobileWishlistCard from "./wishlist/MobileWishlistCard";
import AllItemsView from "./wishlist/AllItemsView";

// Form schema for validation (keep consistent with dialog components)
const wishlistFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  priority: z.enum(["low", "medium", "high"]).optional()
});

type WishlistFormValues = z.infer<typeof wishlistFormSchema>;

// Utility: Strongly clean up any inputted category - trims and nulls whitespace/empty
function cleanCategory(category: unknown): string | null {
  if (typeof category !== "string") return null;
  const trimmed = category.trim();
  return trimmed.length > 0 ? trimmed : null;
}

// Utility: returns true if s is a non-empty, non-whitespace string
function isValidCategoryString(s: unknown): s is string {
  return typeof s === "string" && s.trim().length > 0;
}

type ViewMode = "pinterest" | "grid" | "list" | "all-items";
type SortOption = "recent" | "name" | "items" | "updated";

const MyWishlists = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentWishlist, setCurrentWishlist] = useState<Wishlist | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("all-items");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const { user } = useAuth();
  
  // Detect mobile screen size (declare before any early returns)
  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);
  
  // Use unified wishlist system directly
  const {
    wishlists,
    loading: isLoading,
    loadWishlists,
    createWishlist,
    deleteWishlist,
    removeFromWishlist,
    updateWishlist,
    updateWishlistSharing,
  } = useUnifiedWishlistSystem();

  // Use the sanitize utility to provide *only* cleaned categories
  const selectableCategories = React.useMemo(() => {
    const cats = getValidWishlistCategories(wishlists || []);
    const sanitized = sanitizeCategories(cats);
    return sanitized.filter(cat => cat && typeof cat === "string" && cat.trim().length > 0);
  }, [wishlists]);

  // Filter and sort wishlists based on category, search query, and sort option
  const filteredAndSortedWishlists = React.useMemo(() => {
    if (!wishlists) return [];
    
    let filtered = wishlists.filter(wishlist => {
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

    // Sort wishlists
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
  }, [wishlists, categoryFilter, searchQuery, sortBy]);

  // Contextual data for enhanced features
  const contextualData = React.useMemo(() => {
    const trendingCategories = selectableCategories.slice(0, 6); // Mock trending
    return {
      recentlyViewedCount: 5, // Mock data - could come from localStorage or API
      trendingCategories,
      collaborativeWishlists: 0, // Mock data
    };
  }, [selectableCategories]);

  // Defensive: Ensure filter is always valid—if not, reset it to null
  React.useEffect(() => {
    if (
      categoryFilter &&
      (!selectableCategories.includes(categoryFilter) ||
        typeof categoryFilter !== "string" ||
        !categoryFilter.trim())
    ) {
      console.warn("[Wishlists] Resetting invalid categoryFilter value", categoryFilter);
      setCategoryFilter(null);
    }
  }, [categoryFilter, selectableCategories]);

  const handleCreateWishlist = () => {
    setDialogOpen(true);
  };

  const handleDialogSubmit = async (values: WishlistFormValues) => {
    // Only pass title and description to createWishlist
    await createWishlist({ title: values.title, description: values.description || "" });
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

  const handleEditDialogSubmit = async (values: { title: string; description?: string }) => {
    if (!currentWishlist) return;

    // Close dialog immediately for smooth UX (optimistic)
    setEditDialogOpen(false);

    await updateWishlist({
      wishlistId: currentWishlist.id,
      data: {
        title: values.title,
        description: values.description || "",
      },
    });
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
        const success = await deleteWishlist(currentWishlist.id);
        if (success) {
          setDeleteDialogOpen(false);
          setCurrentWishlist(null);
        }
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
      await loadWishlists();
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
  if (!wishlists) {
    return (
      <InitErrorState refreshing={refreshing} onRetry={loadWishlists} />
    );
  }



  // Mobile Layout
  if (isMobile) {
    return (
      <div className="space-y-0">
        <MobileWishlistLayout
          wishlists={wishlists}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          viewMode={viewMode === "pinterest" || viewMode === "all-items" ? "grid" : viewMode}
          onViewModeChange={(mode) => setViewMode(mode)}
          sortBy={sortBy}
          onSortChange={setSortBy}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={setCategoryFilter}
          availableCategories={selectableCategories}
          totalWishlists={wishlists?.length || 0}
          onCreateNew={() => setDialogOpen(true)}
          onRefresh={handleRefresh}
          isRefreshing={refreshing}
        >
          {/* Empty state for filtered results */}
          {wishlists?.length > 0 && filteredAndSortedWishlists.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No wishlists match your filters</p>
              <Button variant="outline" onClick={clearFilters} className="rounded-xl">
                Clear Filters
              </Button>
            </div>
          )}

          {/* Mobile Wishlists Display */}
          {filteredAndSortedWishlists.length > 0 ? (
            <div className={`${viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 gap-4" : "space-y-4"} pb-safe-or-6`}
              style={{ 
                paddingBottom: 'max(1.5rem, calc(env(safe-area-inset-bottom, 0px) + 2rem))' 
              }}
            >
              {filteredAndSortedWishlists.map((wishlist) => (
                <MobileWishlistCard
                  key={wishlist.id}
                  wishlist={wishlist}
                  onEdit={handleEditWishlist}
                  onDelete={handleDeleteWishlist}
                />
              ))}
            </div>
          ) : wishlists?.length === 0 ? (
            <div className="text-center py-12 pb-safe-or-6"
              style={{ 
                paddingBottom: 'max(3rem, calc(env(safe-area-inset-bottom, 0px) + 4rem))' 
              }}
            >
              <div className="max-w-sm mx-auto">
                <h3 className="text-lg font-semibold mb-2">Create Your First Wishlist</h3>
                <p className="text-muted-foreground text-sm mb-6">
                  Start building your wishlist to share with friends and family.
                </p>
                <CreateWishlistCard onCreateNew={() => setDialogOpen(true)} />
              </div>
            </div>
           ) : null}
        </MobileWishlistLayout>

        {/* Mobile Dialogs - Add here so they work in mobile view */}
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
  }

  // Desktop Layout - Original design
  return (
    <div className="space-y-0">
      {/* All Items View - Full Width with Profile Sidebar */}
      {viewMode === "all-items" ? (
        <AllItemsView wishlists={wishlists} onCreateWishlist={() => setDialogOpen(true)} />
      ) : (
        <div className="space-y-6 px-6 py-6">
          <EnhancedWishlistHeader
            onCreateNew={() => setDialogOpen(true)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            sortBy={sortBy}
            onSortChange={setSortBy}
            categoryFilter={categoryFilter}
            onCategoryFilterChange={setCategoryFilter}
            availableCategories={selectableCategories}
            totalWishlists={wishlists?.length || 0}
          />
          
          <Alert className="border-border/50">
            <AlertDescription>
              Create wishlists for different occasions and share them with friends and family. Browse the marketplace to add items to your wishlists.
            </AlertDescription>
          </Alert>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Content Area */}
            <div className="lg:col-span-3">
            <>
              {/* Empty state for filtered results */}
              {wishlists?.length > 0 && filteredAndSortedWishlists.length === 0 && (
                <div className="contextual-section p-6 text-center">
                  <p className="text-muted-foreground mb-2">No wishlists match your filters</p>
                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </div>
              )}

              {/* Wishlists Display */}
              {viewMode === "pinterest" && filteredAndSortedWishlists.length > 0 ? (
            <PinterestStyleWishlistGrid
              wishlists={filteredAndSortedWishlists}
              onEdit={handleEditWishlist}
              onDelete={handleDeleteWishlist}
              onUpdateSharing={async (wishlistId: string, isPublic: boolean) => {
                await updateWishlistSharing({ wishlistId, isPublic });
                return true;
              }}
            />
          ) : viewMode === "grid" && filteredAndSortedWishlists.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedWishlists.map((wishlist) => (
                <WishlistCard 
                  key={wishlist.id}
                  wishlist={wishlist}
                  onEdit={handleEditWishlist}
                  onDelete={handleDeleteWishlist}
                />
              ))}
            </div>
          ) : viewMode === "list" && filteredAndSortedWishlists.length > 0 ? (
            <div className="space-y-4">
              {filteredAndSortedWishlists.map((wishlist) => (
                <WishlistCard 
                  key={wishlist.id}
                  wishlist={wishlist}
                  onEdit={handleEditWishlist}
                  onDelete={handleDeleteWishlist}
                />
              ))}
            </div>
          ) : wishlists?.length === 0 ? (
            <div className="contextual-section p-12 text-center">
              <div className="max-w-md mx-auto">
                <h3 className="text-lg font-medium mb-2">Create Your First Wishlist</h3>
                <p className="text-muted-foreground mb-6">
                  Start building your wishlist to share with friends and family. It's the perfect way to let others know what you'd love to receive!
                </p>
                <CreateWishlistCard onCreateNew={() => setDialogOpen(true)} />
              </div>
            </div>
          ) : null}
            </>
            </div>

            {/* Sidebar with Contextual Actions - Only for non-all-items views */}
            <div className="lg:col-span-1 space-y-4">
              <TagBasedRecommendations />
              <ContextualWishlistActions
                recentlyViewedCount={contextualData.recentlyViewedCount}
                trendingCategories={contextualData.trendingCategories}
                collaborativeWishlists={contextualData.collaborativeWishlists}
              />
            </div>
          </div>
        </div>
      )}

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
