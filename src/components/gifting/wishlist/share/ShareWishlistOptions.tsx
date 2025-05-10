
import React, { useState } from "react";
import { CopyIcon, Mail, Check, X, ExternalLink } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface ShareWishlistOptionsProps {
  wishlistId: string;
}

const ShareWishlistOptions = ({ wishlistId }: ShareWishlistOptionsProps) => {
  const [activeTab, setActiveTab] = useState<string>("link");
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState(false);

  // Base URL for sharing
  const baseUrl = window.location.origin;
  const shareUrl = wishlistId ? `${baseUrl}/shared-wishlist/${wishlistId}` : "";

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
      <div className="flex flex-col space-y-1">
        <h3 className="text-sm font-medium flex items-center gap-2">
          Share Your Wishlist
          <Badge variant="outline" className="font-normal text-[10px] bg-green-50 text-green-700 border-green-200">
            Public
          </Badge>
        </h3>
        <p className="text-xs text-muted-foreground">
          Your wishlist is public and can be shared with others
        </p>
      </div>
      
      <Tabs defaultValue="link" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="link" className="text-xs">Share Link</TabsTrigger>
          <TabsTrigger value="email" className="text-xs">Via Email</TabsTrigger>
        </TabsList>
        
        <TabsContent value="link" className="pt-4 space-y-4">
          <div className="flex items-center space-x-2">
            <Input 
              value={shareUrl}
              readOnly
              className="text-sm font-mono text-xs"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyLink}
              className="shrink-0"
            >
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <CopyIcon className="h-4 w-4" />}
            </Button>
          </div>
          
          <div className="flex flex-col gap-2">
            <Button 
              variant="outline" 
              size="sm"
              className="w-full justify-start text-sm"
              onClick={() => {
                window.open(shareUrl, '_blank');
              }}
            >
              <ExternalLink className="h-3.5 w-3.5 mr-2" />
              Preview shared wishlist
            </Button>
            
            <div className="flex justify-between gap-2 mt-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1 text-xs"
                onClick={() => {
                  window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent("Check out my wishlist!")}`, '_blank');
                }}
              >
                <svg className="h-3.5 w-3.5 mr-2 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.05l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                Share on Twitter
              </Button>
              
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1 text-xs"
                onClick={() => {
                  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
                }}
              >
                <svg className="h-3.5 w-3.5 mr-2 text-blue-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Share on Facebook
              </Button>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="email" className="pt-4 space-y-4">
          <div className="space-y-2">
            <label htmlFor="email-input" className="text-xs text-muted-foreground">
              Enter email address to share with
            </label>
            <div className="flex items-center space-x-2">
              <Input 
                id="email-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="friend@example.com"
                type="email"
                className="flex-1"
              />
              <Button
                variant="default"
                onClick={handleSendEmail}
                className="shrink-0"
                disabled={!email}
                size="sm"
              >
                <Mail className="h-4 w-4 mr-1" />
                Send
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground mt-2">
              We'll send an email invitation with a link to view your wishlist
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ShareWishlistOptions;
