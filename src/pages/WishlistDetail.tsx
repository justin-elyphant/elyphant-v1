import React, { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, Share2, Trash2, Plus, Globe, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import WishlistItemsGrid from "@/components/gifting/wishlist/WishlistItemsGrid";
import ShareStatusBadge from "@/components/gifting/wishlist/ShareStatusBadge";
import WishlistCategoryBadge from "@/components/gifting/wishlist/categories/WishlistCategoryBadge";
import WishlistShareButton from "@/components/gifting/wishlist/share/WishlistShareButton";
import StandardBackButton from "@/components/shared/StandardBackButton";
import { useUnifiedWishlistSystem } from "@/hooks/useUnifiedWishlistSystem";
import { useWishlist } from "@/components/gifting/hooks/useWishlist";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { toast } from "sonner";
import { WishlistItem } from "@/types/profile";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { motion } from "framer-motion";

const WishlistDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { wishlists, loading, deleteWishlist, loadWishlists } = useUnifiedWishlistSystem();
  const { removeFromWishlist, updateWishlistSharing } = useWishlist();
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);

  // Memoize wishlist lookup to prevent unnecessary re-renders
  const wishlist = useMemo(() => {
    return wishlists.find(w => w.id === id);
  }, [wishlists, id]);

  // Calculate total price
  const totalPrice = useMemo(() => {
    if (!wishlist?.items?.length) return 0;
    return wishlist.items.reduce((sum, item) => sum + (item.price || 0), 0);
  }, [wishlist?.items]);

  // Get user display info
  const userName = useMemo(() => {
    if (profile?.first_name) return profile.first_name;
    if (profile?.name) return profile.name.split(' ')[0];
    if (user?.user_metadata?.first_name) return user.user_metadata.first_name;
    if (user?.user_metadata?.name) return user.user_metadata.name.split(' ')[0];
    return "My";
  }, [profile, user]);

  const avatarUrl = profile?.profile_image || user?.user_metadata?.avatar_url;
  const userInitials = userName.charAt(0).toUpperCase();

  const handleRemoveItem = async (item: WishlistItem) => {
    if (!wishlist) return;
    
    try {
      setRemovingItemId(item.id);
      const success = await removeFromWishlist(wishlist.id, item.id);
      if (success) {
        await loadWishlists();
        toast.success("Item removed from wishlist");
      }
    } catch (error) {
      console.error("Error removing item:", error);
      toast.error("Failed to remove item");
    } finally {
      setRemovingItemId(null);
    }
  };

  const handleEdit = () => {
    toast.info("Edit functionality coming soon!");
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!wishlist) return;
    
    try {
      setDeleting(true);
      const success = await deleteWishlist(wishlist.id);
      if (success) {
        navigate('/wishlists');
      }
    } catch (error) {
      console.error("Error deleting wishlist:", error);
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </SidebarLayout>
    );
  }

  if (!wishlist) {
    return (
      <SidebarLayout>
        <div className="container mx-auto py-8 px-4">
          <div className="flex items-center justify-center h-64 flex-col gap-4">
            <p className="text-muted-foreground">Wishlist not found</p>
            <StandardBackButton to="/wishlists" text="Back to Wishlists" />
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="bg-background min-h-screen">
        {/* Gradient Hero Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-purple-500 to-sky-500">
          {/* Decorative pattern overlay */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, white 1px, transparent 1px),
                               radial-gradient(circle at 75% 75%, white 1px, transparent 1px)`,
              backgroundSize: '40px 40px'
            }} />
          </div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Back button */}
            <div className="mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/wishlists')}
                className="text-white/90 hover:text-white hover:bg-white/10 gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Wishlists
              </Button>
            </div>

            {/* Main header content */}
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <Avatar className="h-20 w-20 lg:h-24 lg:w-24 border-4 border-white/20 shadow-xl flex-shrink-0">
                <AvatarImage src={avatarUrl} alt={userName} />
                <AvatarFallback className="text-2xl lg:text-3xl bg-white/20 text-white">
                  {userInitials}
                </AvatarFallback>
              </Avatar>

              {/* Title & metadata */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap mb-2">
                  <h1 className="text-2xl lg:text-3xl font-bold text-white truncate">
                    {wishlist.title}
                  </h1>
                  
                  {/* Public/Private Badge */}
                  <Badge 
                    variant="secondary" 
                    className="bg-white/20 text-white border-0 backdrop-blur-sm gap-1.5"
                  >
                    {wishlist.is_public ? (
                      <>
                        <Globe className="h-3 w-3" />
                        Public
                      </>
                    ) : (
                      <>
                        <Lock className="h-3 w-3" />
                        Private
                      </>
                    )}
                  </Badge>
                </div>

                {/* Stats line */}
                <p className="text-white/80 text-base lg:text-lg">
                  {wishlist.items?.length || 0} {(wishlist.items?.length || 0) === 1 ? 'item' : 'items'}
                  {totalPrice > 0 && (
                    <>
                      <span className="mx-2">•</span>
                      {formatPrice(totalPrice)} total
                    </>
                  )}
                </p>

                {/* Description */}
                {wishlist.description && (
                  <p className="text-white/70 mt-2 text-sm lg:text-base max-w-xl line-clamp-2">
                    {wishlist.description}
                  </p>
                )}
              </div>

              {/* Action buttons - Desktop */}
              <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button
                    asChild
                    className="h-11 px-6 bg-white text-purple-600 hover:bg-white/90 font-semibold shadow-lg gap-2"
                  >
                    <Link to="/marketplace">
                      <Plus className="h-4 w-4" />
                      Add Items
                    </Link>
                  </Button>
                </motion.div>
                
                <WishlistShareButton 
                  wishlist={wishlist}
                  size="md"
                  iconOnly
                  onShareSettingsChange={updateWishlistSharing}
                  className="h-11 w-11 bg-white/20 hover:bg-white/30 text-white border-0"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Action Bar */}
        <div className="lg:hidden sticky top-0 z-30 bg-background border-b border-border px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShareStatusBadge 
                isPublic={wishlist.is_public} 
                showText={true}
                size="sm"
              />
              <WishlistShareButton 
                wishlist={wishlist}
                size="sm"
                iconOnly
                onShareSettingsChange={updateWishlistSharing}
              />
            </div>
            
            <Button asChild size="sm" className="bg-gradient-to-r from-purple-600 to-sky-500 hover:from-purple-700 hover:to-sky-600 gap-1.5">
              <Link to="/marketplace">
                <Plus className="h-4 w-4" />
                Add Items
              </Link>
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Filter/Toolbar row - matches Wishlists page style */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <span className="text-base font-medium text-foreground">
                {wishlist.items?.length || 0} {(wishlist.items?.length || 0) === 1 ? 'item' : 'items'}
              </span>
              
              {wishlist.category && (
                <WishlistCategoryBadge category={wishlist.category} />
              )}
            </div>

            {/* Desktop action buttons */}
            <div className="hidden lg:flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleEdit} className="gap-1.5">
                <Edit className="h-4 w-4" />
                Edit
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDeleteClick}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-1.5"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>

          {/* Items grid */}
          <WishlistItemsGrid
            items={wishlist.items || []}
            onSaveItem={handleRemoveItem}
            savingItemId={removingItemId}
          />
        </div>

        {/* Delete confirmation dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete this wishlist?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the wishlist "{wishlist.title}" and all items within it.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteConfirm} 
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
    </SidebarLayout>
  );
};

export default WishlistDetail;
