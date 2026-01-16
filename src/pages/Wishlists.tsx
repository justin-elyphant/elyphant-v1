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
import CompactProfileHeader from "@/components/gifting/wishlist/CompactProfileHeader";
import MainLayout from "@/components/layout/MainLayout";
import { cn } from "@/lib/utils";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Heart, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { triggerHapticFeedback, HapticPatterns } from "@/utils/haptics";
import "@/styles/mobile-wishlist.css";

type TabMode = "wishlists" | "nicole";

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

  // Desktop tab and sort state
  const [activeTab, setActiveTab] = useState<TabMode>("wishlists");
  const [sortBy, setSortBy] = useState<"recent" | "name" | "items" | "updated">("recent");

  // Get current wishlist for editing
  const currentWishlist = wishlists?.find(w => w.id === currentWishlistId) || null;

  // Calculate total items across all wishlists
  const totalItems = useMemo(() => {
    return wishlists?.reduce((acc, w) => acc + (w.items?.length || 0), 0) || 0;
  }, [wishlists]);

  // Sort wishlists for desktop
  const sortedWishlists = useMemo(() => {
    const list = wishlists || [];
    return [...list].sort((a, b) => {
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
  }, [wishlists, sortBy]);

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

  // Handle tab switch with haptic
  const handleTabSwitch = (tab: TabMode) => {
    triggerHapticFeedback(HapticPatterns.tabSwitch);
    setActiveTab(tab);
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

  // Desktop layout - Now with tabs and CompactProfileHeader for consistency
  return (
    <MainLayout>
      <ProductProvider>
        <div className="bg-background min-h-screen">
          {/* Compact Profile Header - matching mobile/tablet */}
          <CompactProfileHeader 
            wishlists={wishlists || []}
            onCreateWishlist={() => setCreateDialogOpen(true)}
            showGiftTracker={true}
            className="sticky top-0 z-40"
          />

          {/* Tab Toggle - matching mobile/tablet style */}
          <div className="sticky top-[72px] z-30 bg-background/95 backdrop-blur-sm border-b border-border/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
              <div className="flex bg-muted/50 rounded-xl p-1 max-w-md">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "flex-1 h-10 rounded-lg text-sm font-medium transition-all gap-2",
                    activeTab === "wishlists"
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => handleTabSwitch("wishlists")}
                >
                  <Heart className="h-4 w-4" />
                  My Wishlists
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "flex-1 h-10 rounded-lg text-sm font-medium transition-all gap-2",
                    activeTab === "nicole"
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => handleTabSwitch("nicole")}
                >
                  <Sparkles className="h-4 w-4" />
                  Nicole AI
                </Button>
              </div>
            </div>
          </div>

          {/* Content based on active tab */}
          {activeTab === "nicole" ? (
            /* Nicole AI Tab - Full Experience */
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <NicoleAISuggestions maxProducts={16} variant="full" />
            </div>
          ) : (
            /* Wishlists Tab */
            <>
              {/* Hero Section */}
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                <WishlistHeroSection 
                  wishlistCount={wishlists?.length || 0}
                  totalItemCount={totalItems}
                  onCreateWishlist={() => setCreateDialogOpen(true)}
                />
                
                {/* Benefits Grid - show for users with fewer wishlists */}
                {(wishlists?.length || 0) < 3 && <WishlistBenefitsGrid />}
              </div>

              {/* Sort Bar */}
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
                <div className="flex justify-end">
                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                    <SelectTrigger className="w-[160px] h-10 rounded-lg">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Recently Added</SelectItem>
                      <SelectItem value="name">Name A-Z</SelectItem>
                      <SelectItem value="items">Most Items</SelectItem>
                      <SelectItem value="updated">Last Updated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Wishlists Grid */}
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : sortedWishlists.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {sortedWishlists.map((wishlist) => (
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
            </>
          )}
          
          {/* Shared dialogs for desktop */}
          <WishlistDialogs />
        </div>
      </ProductProvider>
    </MainLayout>
  );
};

export default Wishlists;
