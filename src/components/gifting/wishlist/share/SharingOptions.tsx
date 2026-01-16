
import React, { useState } from "react";
import { CopyIcon, Mail, Check, X, Share2, Link as LinkIcon } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getWishlistShareUrl } from "@/utils/urlUtils";

interface SharingOptionsProps {
  isPublic: boolean;
  wishlistId: string;
}

const SharingOptions = ({ isPublic, wishlistId }: SharingOptionsProps) => {
  const [shareOption, setShareOption] = useState<"link" | "email">("link");
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState(false);

  const shareUrl = wishlistId ? getWishlistShareUrl(wishlistId) : "";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSendEmail = () => {
    if (!email) {
      toast.error("Please enter an email address");
      return;
    }
    
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    // In a real implementation, this would send an email
    // For now, we'll just show a success toast
    toast.success(`Invitation sent to ${email}`);
    setEmail("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Share Options</h3>
        <div className="bg-gray-100 px-2 py-0.5 rounded text-xs font-medium text-gray-700">
          {isPublic ? "Shareable" : "Not Shareable"}
        </div>
      </div>
      
      <RadioGroup value={shareOption} onValueChange={(value) => setShareOption(value as "link" | "email")} className="space-y-3">
        <div className={`flex items-center space-x-2 px-3 py-2 rounded-md ${shareOption === 'link' ? 'bg-muted/60' : ''}`}>
          <RadioGroupItem value="link" id="share-link" />
          <Label htmlFor="share-link" className="flex items-center gap-2 cursor-pointer">
            <LinkIcon className="h-3.5 w-3.5 text-blue-500" />
            <span>Share with link</span>
          </Label>
        </div>
        
        <div className={`flex items-center space-x-2 px-3 py-2 rounded-md ${shareOption === 'email' ? 'bg-muted/60' : ''}`}>
          <RadioGroupItem value="email" id="share-email" />
          <Label htmlFor="share-email" className="flex items-center gap-2 cursor-pointer">
            <Mail className="h-3.5 w-3.5 text-purple-500" />
            <span>Share via email</span>
          </Label>
        </div>
      </RadioGroup>

      {shareOption === "link" ? (
        <div className="flex flex-col space-y-2">
          <Label htmlFor="share-link-input" className="text-xs text-muted-foreground">
            Copy this link to share your wishlist
          </Label>
          <div className="flex items-center space-x-2">
            <Input 
              id="share-link-input"
              value={shareUrl}
              readOnly
              className="flex-1 text-sm bg-muted/30"
              disabled={!isPublic}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyLink}
              className="shrink-0"
              disabled={!isPublic}
            >
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <CopyIcon className="h-4 w-4" />}
            </Button>
          </div>
          
          <div className="flex justify-center pt-2">
            {isPublic && (
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-xs flex items-center gap-1 h-7 px-2"
                  onClick={() => {
                    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent("Check out my wishlist!")}`, '_blank');
                  }}
                >
                  <svg className="h-3.5 w-3.5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.05l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  Share
                </Button>
                
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-xs flex items-center gap-1 h-7 px-2"
                  onClick={() => {
                    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
                  }}
                >
                  <svg className="h-3.5 w-3.5 text-blue-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Share
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col space-y-2">
          <Label htmlFor="share-email-input" className="text-xs text-muted-foreground">
            Enter email address to share with
          </Label>
          <div className="flex items-center space-x-2">
            <Input 
              id="share-email-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="friend@example.com"
              type="email"
              className="flex-1"
              disabled={!isPublic}
            />
            <Button
              variant="outline"
              onClick={handleSendEmail}
              className="shrink-0"
              disabled={!isPublic || !email}
              size="sm"
            >
              Send
            </Button>
          </div>
        </div>
      )}

      {!isPublic && (
        <div className="rounded-md bg-yellow-50 p-3">
          <div className="flex">
            <div className="text-yellow-700">
              <p className="text-xs">
                You need to make the wishlist public before sharing.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SharingOptions;
