
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Heart, Users, Lock } from "lucide-react";
import { Wishlist } from "@/types/profile";

interface WishlistSharePreviewProps {
  wishlist: Wishlist;
  onViewWishlist?: () => void;
}

const WishlistSharePreview = ({
  wishlist,
  onViewWishlist
}: WishlistSharePreviewProps) => {
  const itemCount = wishlist.items?.length || 0;
  const previewItems = wishlist.items?.slice(0, 3) || [];

  return (
    <Card className="max-w-sm my-2">
      <CardContent className="p-3">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex gap-3">
            <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center flex-shrink-0">
              <Heart className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate">{wishlist.title}</h4>
              <p className="text-xs text-muted-foreground">
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </p>
              <div className="flex items-center gap-1 mt-1">
                {wishlist.is_public ? (
                  <>
                    <Users className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-green-600">Public</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Private</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Preview Items */}
          {previewItems.length > 0 && (
            <div className="flex gap-1 overflow-hidden">
              {previewItems.map((item, index) => (
                <div 
                  key={item.id || index} 
                  className="w-16 h-16 bg-muted rounded-md overflow-hidden flex-shrink-0"
                >
                  {item.image_url ? (
                    <img 
                      src={item.image_url} 
                      alt={item.title || item.name || ''}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Heart className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
              {itemCount > 3 && (
                <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
                  <span className="text-xs font-medium text-muted-foreground">
                    +{itemCount - 3}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {wishlist.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {wishlist.description}
            </p>
          )}

          {/* Action Button */}
          <Button
            size="sm"
            variant="outline"
            className="w-full h-7 text-xs"
            onClick={onViewWishlist}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            View Wishlist
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default WishlistSharePreview;
