
import React, { useState } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonProps } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import ShareWishlistDialog from "./ShareWishlistDialog";
import { Wishlist } from "@/types/profile";

interface WishlistShareButtonProps extends Omit<ButtonProps, "onClick"> {
  wishlist: Wishlist;
  size?: "sm" | "md" | "lg" | "icon";
  showLabel?: boolean;
  onShareSettingsChange: (wishlistId: string, isPublic: boolean) => Promise<boolean>;
  className?: string;
}

const WishlistShareButton = ({ 
  wishlist, 
  size = "md", 
  showLabel = true,
  onShareSettingsChange,
  className,
  variant = "outline",
  ...props 
}: WishlistShareButtonProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDialogOpen(true);
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <Button
              variant={variant}
              size={size}
              onClick={handleOpen}
              className={className}
              {...props}
            >
              <Share2 className={`${showLabel ? "mr-2 " : ""}h-4 w-4`} />
              {showLabel && "Share"}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Share this wishlist</TooltipContent>
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
