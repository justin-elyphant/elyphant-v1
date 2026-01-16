import React, { useState, useMemo } from "react";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/contexts/profile/ProfileContext";
import MyWishlists from "@/components/gifting/MyWishlists";
import MobileWishlistHub from "@/components/gifting/wishlist/MobileWishlistHub";
import TabletWishlistLayout from "@/components/gifting/wishlist/TabletWishlistLayout";
import { ProductProvider } from "@/contexts/ProductContext";
import { useUnifiedWishlistSystem } from "@/hooks/useUnifiedWishlistSystem";
import CreateWishlistDialog from "@/components/gifting/wishlist/CreateWishlistDialog";
import EditWishlistDialog from "@/components/gifting/wishlist/EditWishlistDialog";
import WishlistHeroSection from "@/components/gifting/wishlist/WishlistHeroSection";
import WishlistBenefitsGrid from "@/components/gifting/wishlist/WishlistBenefitsGrid";
import NicoleAISuggestions from "@/components/gifting/wishlist/NicoleAISuggestions";
import UnifiedWishlistCollectionCard from "@/components/gifting/wishlist/UnifiedWishlistCollectionCard";
import MainLayout from "@/components/layout/MainLayout";
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
import { Loader2 } from "lucide-react";
import "@/styles/mobile-wishlist.css";

const Wishlists = () => {
  const { user } = useAuth();
  const { profile } = useProfile();

  // Wishlist management
  const {
    wishlists,
    loading: isLoading,
    createWishlist,
    deleteWishlist,
    updateWishlist,
    updateWishlistSharing,
  } = useUnifiedWishlistSystem();

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentWishlistId, setCurrentWishlistId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Get current wishlist for editing
  const currentWishlist = wishlists?.find(w => w.id === currentWishlistId) || null;

  // Calculate total items across all wishlists
  const totalItems = useMemo(() => {
    return wishlists?.reduce((acc, w) => acc + (w.items?.length || 0), 0) || 0;
  }, [wishlists]);

  // Handlers
  const handleCreateWishlist = async (values: { title: string; description?: string }) => {
    await createWishlist({ title: values.title, description: values.description || "" });
    setCreateDialogOpen(false);
  };

  const handleEditWishlist = (id: string) => {
    setCurrentWishlistId(id);
    setEditDialogOpen(true);
  };

  const handleEditDialogSubmit = async (values: {
    title: string;
    description?: string;
  }) => {
    if (!currentWishlistId) return;

    // Close dialog immediately for smooth UX (optimistic)
    setEditDialogOpen(false);

    await updateWishlist({
      wishlistId: currentWishlistId,
      data: {
        title: values.title,
        description: values.description || "",
      },
    });
  };

  const handleDeleteWishlist = (id: string) => {
    setCurrentWishlistId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (currentWishlistId) {
      try {
        setDeleting(true);
        await deleteWishlist(currentWishlistId);
        setDeleteDialogOpen(false);
        setCurrentWishlistId(null);
      } finally {
        setDeleting(false);
      }
    }
  };

  // Detect screen size for conditional layout
  const [screenSize, setScreenSize] = React.useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  React.useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setScreenSize('mobile');
      } else if (width < 1024) {
        setScreenSize('tablet');
      } else {
        setScreenSize('desktop');
      }
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Shared dialogs component
  const WishlistDialogs = () => (
    <>
      <CreateWishlistDialog 
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreateWishlist}
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
            <AlertDialogTitle>Delete wishlist?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{currentWishlist?.title}" and all items within it.
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
    </>
  );

  // Mobile layout - MobileWishlistHub
  if (screenSize === 'mobile') {
    return (
      <MainLayout>
        <ProductProvider>
          <MobileWishlistHub
            wishlists={wishlists || []}
            onCreateWishlist={() => setCreateDialogOpen(true)}
            onEditWishlist={handleEditWishlist}
            onDeleteWishlist={handleDeleteWishlist}
            onUpdateSharing={async (wishlistId: string, isPublic: boolean) => {
              await updateWishlistSharing({ wishlistId, isPublic });
              return true;
            }}
          />
          <WishlistDialogs />
        </ProductProvider>
      </MainLayout>
    );
  }

  // Tablet layout - TabletWishlistLayout
  if (screenSize === 'tablet') {
    return (
      <MainLayout>
        <ProductProvider>
          <TabletWishlistLayout
            wishlists={wishlists || []}
            onCreateWishlist={() => setCreateDialogOpen(true)}
            onEditWishlist={handleEditWishlist}
            onDeleteWishlist={handleDeleteWishlist}
            onUpdateSharing={async (wishlistId: string, isPublic: boolean) => {
              await updateWishlistSharing({ wishlistId, isPublic });
              return true;
            }}
          />
          <WishlistDialogs />
        </ProductProvider>
      </MainLayout>
    );
  }

  // Desktop layout - Simplified e-commerce style (no SidebarLayout, consistent with tablet/mobile)
  return (
    <MainLayout>
      <ProductProvider>
        <div className="bg-background">
          {/* Hero Section */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            <WishlistHeroSection 
              wishlistCount={wishlists?.length || 0}
              totalItemCount={totalItems}
              onCreateWishlist={() => setCreateDialogOpen(true)}
            />
            
            {/* Benefits Grid - show for users with fewer wishlists */}
            {(wishlists?.length || 0) < 3 && <WishlistBenefitsGrid />}
            
            {/* Nicole AI Suggestions - personalized product carousel */}
            <NicoleAISuggestions maxProducts={8} />
          </div>

          {/* Wishlists Grid */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : wishlists && wishlists.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {wishlists.map((wishlist) => (
                  <UnifiedWishlistCollectionCard
                    key={wishlist.id}
                    wishlist={wishlist}
                    variant="desktop"
                    onEdit={handleEditWishlist}
                    onDelete={handleDeleteWishlist}
                    onUpdateSharing={async (wishlistId: string, isPublic: boolean) => {
                      await updateWishlistSharing({ wishlistId, isPublic });
                      return true;
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium mb-2">Create Your First Wishlist</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Start building your wishlist to share with friends and family. 
                  It's the perfect way to let others know what you'd love to receive!
                </p>
              </div>
            )}
          </div>
          
          {/* Shared dialogs for desktop */}
          <WishlistDialogs />
        </div>
      </ProductProvider>
    </MainLayout>
  );
};

export default Wishlists;
