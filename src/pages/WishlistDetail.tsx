import React, { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, Share2, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
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
import { useUnifiedWishlist } from "@/hooks/useUnifiedWishlist";
import { useWishlist } from "@/components/gifting/hooks/useWishlist";
import MainLayout from "@/components/layout/MainLayout";
import { toast } from "sonner";
import { WishlistItem } from "@/types/profile";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";

const WishlistDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { wishlists, loading, deleteWishlist, loadWishlists } = useUnifiedWishlist();
  const { removeFromWishlist, updateWishlistSharing } = useWishlist();
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);

  // Memoize wishlist lookup to prevent unnecessary re-renders
  const wishlist = useMemo(() => {
    return wishlists.find(w => w.id === id);
  }, [wishlists, id]);

  // Memoize priority badge to prevent recalculation
  const priorityBadge = useMemo(() => {
    if (!wishlist?.priority) return null;

    return (
      <div className="flex items-center gap-1 text-sm">
        <div className={`w-2 h-2 rounded-full ${wishlist.priority === 'high' ? 'bg-red-500' : 
          wishlist.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
        <span className="capitalize">{wishlist.priority} priority</span>
      </div>
    );
  }, [wishlist?.priority]);

  const handleRemoveItem = async (item: WishlistItem) => {
    if (!wishlist) return;
    
    try {
      setRemovingItemId(item.id);
      const success = await removeFromWishlist(wishlist.id, item.id);
      if (success) {
        // Force reload of wishlists to ensure UI updates immediately
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
        // Navigate back to wishlists page after successful deletion
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
      <MainLayout>
        <div className="container mx-auto py-8 px-4">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading wishlist...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!wishlist) {
    return (
      <MainLayout>
        <div className="container mx-auto py-8 px-4">
          <div className="flex items-center justify-center h-64 flex-col gap-4">
            <p className="text-muted-foreground">Wishlist not found</p>
            <Button onClick={() => navigate('/wishlists')} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Wishlists
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-8 px-4">
        {/* Header with back button */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            onClick={() => navigate('/wishlists')} 
            variant="outline" 
            size="sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>

        {/* Wishlist header card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <CardTitle className="text-2xl">{wishlist.title}</CardTitle>
                  <ShareStatusBadge 
                    isPublic={wishlist.is_public} 
                    showText={false}
                    size="sm"
                  />
                </div>
                
                {wishlist.description && (
                  <CardDescription className="text-base mb-4">
                    {wishlist.description}
                  </CardDescription>
                )}

                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {wishlist.category && (
                    <WishlistCategoryBadge category={wishlist.category} />
                  )}
                  
                  {priorityBadge}

                  {wishlist.tags?.map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs bg-gray-50">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Stats */}
                <div className="text-sm text-muted-foreground">
                  {wishlist.items?.length || 0} {(wishlist.items?.length || 0) === 1 ? 'item' : 'items'}
                  {wishlist.created_at && (
                    <span className="ml-4">
                      Created {new Date(wishlist.created_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleEdit}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <WishlistShareButton 
                  wishlist={wishlist}
                  size="sm"
                  onShareSettingsChange={updateWishlistSharing}
                />
                <Button variant="outline" size="sm" onClick={handleDeleteClick}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Items grid */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Items ({wishlist.items?.length || 0})</CardTitle>
              <Button asChild>
                <Link to="/marketplace">
                  <Plus className="mr-2 h-4 w-4" />
                  Add More Items
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <WishlistItemsGrid
              items={wishlist.items || []}
              onSaveItem={handleRemoveItem}
              savingItemId={removingItemId}
            />
          </CardContent>
        </Card>

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
    </MainLayout>
  );
};

export default WishlistDetail;
