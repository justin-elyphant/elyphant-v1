
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Copy, Mail, MessageCircle, Check, Link2, Globe, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Wishlist } from "@/types/profile";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface WishlistShareButtonProps {
  wishlist: Wishlist;
  onShareSettingsChange: (wishlistId: string, isPublic: boolean) => Promise<boolean>;
  size?: "sm" | "md" | "default";
  iconOnly?: boolean;
  className?: string;
}

const WishlistShareButton = ({ 
  wishlist, 
  onShareSettingsChange,
  size = "default",
  iconOnly = false,
  className 
}: WishlistShareButtonProps) => {
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  const shareUrl = `${window.location.origin}/shared-wishlist/${wishlist.id}`;
  
  const sizeStyles = {
    sm: iconOnly ? "h-7 w-7 p-0" : "text-xs h-8 px-2 gap-1",
    md: iconOnly ? "h-8 w-8 p-0" : "text-sm h-9 px-3 gap-1.5",
    default: iconOnly ? "h-9 w-9 p-0" : "gap-2"
  };
  
  const iconSize = {
    sm: "h-4 w-4",
    md: "h-4 w-4",
    default: "h-5 w-5"
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      toast.error("Failed to copy link");
    }
  };

  const shareByEmail = () => {
    const subject = encodeURIComponent(`Check out my wishlist: ${wishlist.title}`);
    const body = encodeURIComponent(`I wanted to share my wishlist with you: ${shareUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
    setIsOpen(false);
  };

  const shareByText = () => {
    const message = encodeURIComponent(`Check out my wishlist: ${shareUrl}`);
    window.open(`sms:?body=${message}`);
    setIsOpen(false);
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: wishlist.title,
          text: "Check out my wishlist!",
          url: shareUrl
        });
        toast.success("Shared successfully");
      } catch (err) {
        // User cancelled or error
        console.log("Share cancelled or failed:", err);
      }
    } else {
      copyToClipboard();
    }
    setIsOpen(false);
  };

  const handleMakePublic = async () => {
    const success = await onShareSettingsChange(wishlist.id, true);
    if (success) {
      toast.success("Wishlist is now public and can be shared");
    }
  };
  
  return (
    <TooltipProvider>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant={iconOnly ? "ghost" : "outline"}
                size={iconOnly ? "icon" : "default"}
                className={cn(
                  sizeStyles[size],
                  !iconOnly && "border-border/50",
                  className
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
              >
                <Share2 className={cn(iconSize[size], "text-muted-foreground")} />
                {!iconOnly && <span className="text-foreground">Share</span>}
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={8} className="text-xs z-50">
            {wishlist.is_public 
              ? "Share this wishlist" 
              : "Make public to share"}
          </TooltipContent>
        </Tooltip>

        <DropdownMenuContent align="end" className="w-48 z-50" onClick={(e) => e.stopPropagation()}>
        {wishlist.is_public ? (
          <>
            <DropdownMenuItem onClick={copyToClipboard} className="cursor-pointer">
              {copied ? (
                <Check className="h-4 w-4 mr-2 text-green-600" />
              ) : (
                <Copy className="h-4 w-4 mr-2" />
              )}
              Copy Link
            </DropdownMenuItem>
            <DropdownMenuItem onClick={shareByText} className="cursor-pointer">
              <MessageCircle className="h-4 w-4 mr-2" />
              Text Message
            </DropdownMenuItem>
            <DropdownMenuItem onClick={shareByEmail} className="cursor-pointer">
              <Mail className="h-4 w-4 mr-2" />
              Email
            </DropdownMenuItem>
            <DropdownMenuItem onClick={shareNative} className="cursor-pointer">
              <Share2 className="h-4 w-4 mr-2" />
              More Options...
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-xs text-muted-foreground flex items-center gap-1.5">
              <Globe className="h-3 w-3 text-green-600" />
              This wishlist is public
            </div>
          </>
        ) : (
          <>
            <div className="px-2 py-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5 mb-1">
                <Lock className="h-3.5 w-3.5" />
                <span className="font-medium">Private Wishlist</span>
              </div>
              <p className="text-xs">Make it public to share with others</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleMakePublic} className="cursor-pointer">
              <Globe className="h-4 w-4 mr-2 text-green-600" />
              Make Public & Share
            </DropdownMenuItem>
          </>
        )}
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  );
};

export default WishlistShareButton;
