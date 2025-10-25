import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Eye, EyeOff, Share2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wishlist } from "@/types/profile";
import { useIsMobile } from "@/hooks/use-mobile";
import WishlistSwitcher from "../navigation/WishlistSwitcher";

interface WishlistWorkspaceHeaderProps {
  wishlist: Wishlist;
  ownerProfile: { name?: string; image?: string; id: string } | null;
  isOwner: boolean;
  isGuestPreview: boolean;
  onToggleGuestPreview: () => void;
  onAddItems: () => void;
}

const WishlistWorkspaceHeader = ({
  wishlist,
  ownerProfile,
  isOwner,
  isGuestPreview,
  onToggleGuestPreview,
  onAddItems
}: WishlistWorkspaceHeaderProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const totalValue = wishlist.items.reduce((sum, item) => sum + (item.price || 0), 0);

  return (
    <div className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-4">
        {/* Back button and wishlist switcher */}
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/wishlists')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {!isMobile && "Back to Wishlists"}
          </Button>
          
          {/* Wishlist Switcher */}
          <WishlistSwitcher currentWishlistId={wishlist.id} currentWishlistTitle={wishlist.title} />
        </div>

        {/* Main header content */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Left: Profile and info */}
          <div className="flex items-center gap-4">
            {ownerProfile?.image ? (
              <img 
                src={ownerProfile.image} 
                alt={ownerProfile.name || "Owner"} 
                className="w-16 h-16 rounded-full object-cover border-2 border-border"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border-2 border-border">
                <span className="text-2xl font-semibold text-primary">
                  {ownerProfile?.name?.charAt(0) || 'W'}
                </span>
              </div>
            )}
            
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold">{wishlist.title}</h1>
                {wishlist.is_public ? (
                  <Badge variant="secondary" className="text-xs">Public</Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">Private</Badge>
                )}
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{wishlist.items.length} items</span>
                <span>•</span>
                <span>${totalValue.toFixed(2)} total</span>
                {wishlist.category && (
                  <>
                    <span>•</span>
                    <span className="capitalize">{wishlist.category}</span>
                  </>
                )}
              </div>
              
              {wishlist.description && (
                <p className="text-sm text-muted-foreground mt-1">{wishlist.description}</p>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          {isOwner && (
            <div className="flex items-center gap-2">
              {!isGuestPreview && (
                <Button onClick={onAddItems} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Items
                </Button>
              )}
              
              <Button
                variant={isGuestPreview ? "default" : "outline"}
                onClick={onToggleGuestPreview}
                className="gap-2"
              >
                {isGuestPreview ? (
                  <>
                    <EyeOff className="h-4 w-4" />
                    {!isMobile && "Exit Preview"}
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" />
                    {!isMobile && "Preview as Guest"}
                  </>
                )}
              </Button>
              
              {!isMobile && (
                <>
                  <Button variant="outline" size="icon">
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Guest Preview Banner */}
        {isOwner && isGuestPreview && (
          <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
            <p className="text-sm text-center">
              <Eye className="inline h-4 w-4 mr-2" />
              You're viewing this wishlist as your guests would see it
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistWorkspaceHeader;
