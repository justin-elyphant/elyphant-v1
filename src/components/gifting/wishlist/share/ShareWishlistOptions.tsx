
import React, { useState } from "react";
import { Copy, Check, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ShareWishlistOptionsProps {
  wishlistId: string;
}

const ShareWishlistOptions = ({ wishlistId }: ShareWishlistOptionsProps) => {
  const [copied, setCopied] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  
  const shareUrl = `${window.location.origin}/wishlist/${wishlistId}`;
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied to clipboard");
    
    setTimeout(() => {
      setCopied(false);
    }, 3000);
  };
  
  const handleEmailShare = () => {
    if (!emailInput || !emailInput.includes('@')) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    const subject = "Check out my wishlist!";
    const body = `I wanted to share my wishlist with you. You can view it here: ${shareUrl}`;
    const mailtoLink = `mailto:${emailInput}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    window.open(mailtoLink);
    toast.success("Email client opened");
    setEmailInput("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Input 
          value={shareUrl} 
          readOnly 
          className="flex-grow"
        />
        <Button 
          variant="outline" 
          size="icon" 
          onClick={copyToClipboard}
          title="Copy to clipboard"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
      
      <div className="flex items-center space-x-2">
        <Input
          type="email"
          placeholder="Enter email to share"
          value={emailInput}
          onChange={(e) => setEmailInput(e.target.value)}
          className="flex-grow"
        />
        <Button 
          variant="outline" 
          size="icon" 
          onClick={handleEmailShare}
          title="Share via email"
        >
          <Mail className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ShareWishlistOptions;
