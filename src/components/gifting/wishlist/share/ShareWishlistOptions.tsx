
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Copy, Mail, Share2 } from "lucide-react";
import { toast } from "sonner";
import { getWishlistShareUrl } from "@/utils/urlUtils";

interface ShareWishlistOptionsProps {
  wishlistId: string;
}

const ShareWishlistOptions = ({ wishlistId }: ShareWishlistOptionsProps) => {
  const [copied, setCopied] = useState(false);
  const shareUrl = getWishlistShareUrl(wishlistId);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard");
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      toast.error("Failed to copy link");
    }
  };

  const shareByEmail = () => {
    const subject = encodeURIComponent("Check out my wishlist");
    const body = encodeURIComponent(`I wanted to share my wishlist with you: ${shareUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Wishlist",
          text: "Check out my wishlist!",
          url: shareUrl
        });
        toast.success("Shared successfully");
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      copyToClipboard();
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium mb-2">Share Link</h3>
      
      <div className="flex space-x-2">
        <div className="relative flex-grow">
          <Input
            value={shareUrl}
            readOnly
            className="pr-10"
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
        </div>
        <Button
          onClick={copyToClipboard}
          variant="outline"
          size="icon"
          className="shrink-0"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <Button 
          onClick={shareByEmail}
          variant="outline"
          className="flex-1 flex items-center justify-center"
        >
          <Mail className="h-4 w-4 mr-2" />
          Email
        </Button>
        <Button 
          onClick={shareNative}
          variant="outline" 
          className="flex-1 flex items-center justify-center"
        >
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </div>
    </div>
  );
};

export default ShareWishlistOptions;
