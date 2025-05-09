
import React, { useState } from "react";
import { toast } from "sonner";
import WishlistHeader from "./wishlist/WishlistHeader";
import CreateWishlistCard from "./wishlist/CreateWishlistCard";
import WishlistCard from "./wishlist/WishlistCard";
import CreateWishlistDialog from "./wishlist/CreateWishlistDialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import EditWishlistDialog from "./wishlist/EditWishlistDialog";
import { Wishlist } from "@/types/profile";
import { useWishlist } from "./hooks/useWishlist";
import { Loader2, Share2, AlertTriangle, RefreshCw } from "lucide-react";
import ShareWishlistDialog from "./wishlist/ShareWishlistDialog";
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

const MyWishlists = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentWishlist, setCurrentWishlist] = useState<Wishlist | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  
  const { 
    wishlists, 
    createWishlist, 
    deleteWishlist, 
    isInitialized, 
    isLoading,
    initError,
    updateWishlistSharing,
    reloadWishlists
  } = useWishlist();

  const handleCreateWishlist = () => {
    setDialogOpen(true);
  };

  const handleDialogSubmit = async (values: { title: string; description?: string }) => {
    await createWishlist(values.title, values.description || "");
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

  const handleShareWishlist = (id: string) => {
    const wishlistToShare = wishlists.find(wishlist => wishlist.id === id);
    if (wishlistToShare) {
      setCurrentWishlist(wishlistToShare);
      setShareDialogOpen(true);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await reloadWishlists();
      toast.success("Wishlists refreshed");
    } catch (error) {
      console.error("Error refreshing wishlists:", error);
      toast.error("Failed to refresh wishlists");
    } finally {
      setRefreshing(false);
    }
  };

  // If not authenticated, show a sign-in prompt
  if (!user && !isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Sign In Required</h2>
          <p className="text-gray-600 mb-6">
            Please sign in to create and manage your wishlists.
          </p>
          <div className="flex gap-4">
            <Button asChild variant="default">
              <a href="/login">Sign In</a>
            </Button>
            <Button asChild variant="outline">
              <a href="/register">Create Account</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center py-16">
        <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground">Loading your wishlists...</p>
      </div>
    );
  }

  // Show error state with retry option
  if (initError) {
    return (
      <div className="bg-red-50 p-6 rounded-lg border border-red-200">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Failed to Load Wishlists</h2>
          <p className="text-gray-600 mb-6">
            We couldn't load your wishlists. Please try again.
          </p>
          <Button 
            onClick={handleRefresh} 
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Try Again
          </Button>
        </div>
      </div>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <CreateWishlistCard onCreateNew={() => setDialogOpen(true)} />
        
        {wishlists && wishlists.length > 0 ? (
          wishlists.map((wishlist) => (
            <WishlistCard 
              key={wishlist.id}
              wishlist={wishlist}
              onEdit={handleEditWishlist}
              onShare={handleShareWishlist}
              onDelete={handleDeleteWishlist}
            />
          ))
        ) : (
          <div className="col-span-full py-8 text-center text-muted-foreground">
            No wishlists found. Create your first wishlist to get started!
          </div>
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

      <ShareWishlistDialog 
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        wishlist={currentWishlist}
        onShareSettingsChange={updateWishlistSharing}
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
