
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Globe, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Wishlist } from "@/types/profile";
import ShareWishlistDialog from "../ShareWishlistDialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface WishlistShareButtonProps {
  wishlist: Wishlist;
  onShareSettingsChange: (wishlistId: string, isPublic: boolean) => Promise<boolean>;
  size?: "sm" | "md" | "default";
  className?: string;
}

const WishlistShareButton = ({ 
  wishlist, 
  onShareSettingsChange,
  size = "default",
  className 
}: WishlistShareButtonProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const sizeStyles = {
    sm: "text-xs h-8 px-2 gap-1",
    md: "text-sm h-9 px-3 gap-1.5",
    default: "gap-2"
  };
  
  const iconSize = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    default: "h-5 w-5"
  };
  
  return (
    <>
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                sizeStyles[size],
                "border-border/50",
                className
              )}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setDialogOpen(true);
              }}
            >
              {wishlist.is_public ? (
                <Globe className={cn(iconSize[size], "text-green-600")} />
              ) : (
                <Lock className={cn(iconSize[size], "text-muted-foreground")} />
              )}
              <span className="text-foreground">Share</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            {wishlist.is_public 
              ? "This wishlist is public and can be shared" 
              : "Make this wishlist public to share it"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <ShareWishlistDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        wishlist={wishlist}
        onShareSettingsChange={onShareSettingsChange}
      />
    </>
  );
};

export default WishlistShareButton;
