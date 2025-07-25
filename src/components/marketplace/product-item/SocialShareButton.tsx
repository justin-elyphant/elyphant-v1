
import React, { useState } from "react";
import { Share } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ShareToConnectionButton from "@/components/messaging/ShareToConnectionButton";

interface SocialShareButtonProps {
  product: {
    id: string;
    name: string;
    image?: string;
    price?: number;
    brand?: string;
  };
  variant?: "outline" | "ghost" | "default";
  size?: "sm" | "default" | "lg";
  className?: string;
}

const SocialShareButton = ({ 
  product, 
  variant = "outline", 
  size = "sm",
  className 
}: SocialShareButtonProps) => {
  const [open, setOpen] = useState(false);

  // Generate sharing URLs
  const title = encodeURIComponent(`Check out this gift: ${product.name}`);
  const baseUrl = window.location.origin;
  const productUrl = `${baseUrl}/marketplace?productId=${product.id}`;
  const url = encodeURIComponent(productUrl);
  
  // Sharing links for different platforms
  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    twitter: `https://twitter.com/intent/tweet?text=${title}&url=${url}`,
    pinterest: `https://pinterest.com/pin/create/button/?url=${url}&media=${encodeURIComponent(product.image || '')}&description=${title}`,
    email: `mailto:?subject=${title}&body=I%20thought%20you%20might%20like%20this:%20${url}`,
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(productUrl);
    toast.success("Link copied to clipboard");
    setOpen(false);
  };

  // Convert product to match ShareToConnectionButton expected format
  const shareProduct = {
    product_id: product.id,
    id: product.id,
    title: product.name,
    name: product.name,
    image: product.image || "/placeholder.svg",
    price: product.price || 0,
    brand: product.brand
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant={variant} 
          size={size}
          className={className}
          aria-label="Share product"
        >
          <Share className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3">
        <h4 className="font-medium mb-3">Share this gift</h4>
        <div className="flex flex-col space-y-3">
          {/* Connection Sharing - New Feature */}
          <div className="pb-3 border-b">
            <h5 className="text-sm font-medium mb-2 text-muted-foreground">Share with Friends</h5>
            <ShareToConnectionButton 
              product={shareProduct}
              variant="full" 
              className="w-full justify-start"
            />
          </div>

          {/* Social Media Sharing */}
          <div>
            <h5 className="text-sm font-medium mb-2 text-muted-foreground">Social Media</h5>
            <div className="grid grid-cols-4 gap-2">
              <a 
                href={shareLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center p-2 rounded-md hover:bg-slate-100"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white mb-1">f</div>
                <span className="text-xs">Facebook</span>
              </a>
              <a 
                href={shareLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center p-2 rounded-md hover:bg-slate-100"
              >
                <div className="w-8 h-8 bg-sky-500 rounded-full flex items-center justify-center text-white mb-1">X</div>
                <span className="text-xs">Twitter</span>
              </a>
              <a 
                href={shareLinks.pinterest}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center p-2 rounded-md hover:bg-slate-100"
              >
                <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white mb-1">P</div>
                <span className="text-xs">Pinterest</span>
              </a>
              <a 
                href={shareLinks.email}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center p-2 rounded-md hover:bg-slate-100"
              >
                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white mb-1">@</div>
                <span className="text-xs">Email</span>
              </a>
            </div>
          </div>
          
          <div className="pt-3 border-t">
            <div className="flex items-center">
              <input 
                type="text" 
                value={productUrl} 
                readOnly 
                className="flex-grow p-2 text-xs border rounded-l-md focus:outline-none"
              />
              <Button 
                onClick={copyToClipboard}
                className="rounded-l-none"
                size="sm"
              >
                Copy
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default SocialShareButton;
