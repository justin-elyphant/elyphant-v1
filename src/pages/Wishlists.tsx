
import React, { useState, useMemo } from "react";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/contexts/profile/ProfileContext";
import MyWishlists from "@/components/gifting/MyWishlists";
import MobileWishlistHub from "@/components/gifting/wishlist/MobileWishlistHub";
import TabletWishlistLayout from "@/components/gifting/wishlist/TabletWishlistLayout";
import CollectionsTab from "@/components/gifting/wishlists/CollectionsTab";
import { ProductProvider } from "@/contexts/ProductContext";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUnifiedWishlistSystem } from "@/hooks/useUnifiedWishlistSystem";
import CreateWishlistDialog from "@/components/gifting/wishlist/CreateWishlistDialog";
import EditWishlistDialog from "@/components/gifting/wishlist/EditWishlistDialog";
import WishlistHeroSection from "@/components/gifting/wishlist/WishlistHeroSection";
import WishlistBenefitsGrid from "@/components/gifting/wishlist/WishlistBenefitsGrid";
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
  const [activeTab, setActiveTab] = useState("wishlists");

  // Wishlist management
  const {
    wishlists,
    loading: isLoading,
    createWishlist,
    deleteWishlist,
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
        onSubmit={async () => setEditDialogOpen(false)}
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

  // Mobile layout - New MobileWishlistHub
  if (screenSize === 'mobile') {
    return (
      <ProductProvider>
        <MobileWishlistHub
          wishlists={wishlists || []}
          onCreateWishlist={() => setCreateDialogOpen(true)}
          onEditWishlist={handleEditWishlist}
          onDeleteWishlist={handleDeleteWishlist}
        />
        <WishlistDialogs />
      </ProductProvider>
    );
  }

  // Tablet layout - New TabletWishlistLayout with CompactProfileHeader
  if (screenSize === 'tablet') {
    return (
      <ProductProvider>
        <TabletWishlistLayout
          wishlists={wishlists || []}
          onCreateWishlist={() => setCreateDialogOpen(true)}
          onEditWishlist={handleEditWishlist}
          onDeleteWishlist={handleDeleteWishlist}
        />
        <WishlistDialogs />
      </ProductProvider>
    );
  }

  // Desktop layout - Full width immersive shopping experience (existing)
  return (
    <SidebarLayout>
      <ProductProvider>
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
          {/* Hero Section */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            <WishlistHeroSection 
              wishlistCount={wishlists?.length || 0}
              totalItemCount={totalItems}
              onCreateWishlist={() => setCreateDialogOpen(true)}
            />
            
            {/* Benefits Grid - show for users with fewer wishlists */}
            {(wishlists?.length || 0) < 3 && <WishlistBenefitsGrid />}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsContent value="wishlists" className="mt-0">
              <MyWishlists />
            </TabsContent>
            
            <TabsContent value="collections" className="mt-0 container max-w-6xl mx-auto py-8">
              <CollectionsTab />
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Shared dialogs for desktop */}
        <WishlistDialogs />
      </ProductProvider>
    </SidebarLayout>
  );
};

export default Wishlists;
