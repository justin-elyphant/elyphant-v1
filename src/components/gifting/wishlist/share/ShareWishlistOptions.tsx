
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Link, Copy, Check, Mail, Smartphone, QrCode } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ShareWishlistOptionsProps {
  wishlistId: string;
  className?: string;
}

const ShareWishlistOptions = ({ wishlistId, className }: ShareWishlistOptionsProps) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"link" | "email" | "qr">("link");
  const [email, setEmail] = useState("");

  // Generate the share URL
  const baseUrl = window.location.origin;
  const shareUrl = `${baseUrl}/shared-wishlist/${wishlistId}`;

  // Handle copy to clipboard
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle email sharing
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

    // Email share logic would go here
    // For now, we'll just open the mail client
    window.location.href = `mailto:${email}?subject=Check out my wishlist&body=I wanted to share my wishlist with you: ${shareUrl}`;
    
    toast.success(`Email sharing initiated for ${email}`);
    setEmail("");
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-sm font-medium mb-2">Share this wishlist</h3>
      
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as typeof activeTab)}>
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="link" className="text-xs">
            <Link className="h-3 w-3 mr-1.5" />
            Link
          </TabsTrigger>
          <TabsTrigger value="email" className="text-xs">
            <Mail className="h-3 w-3 mr-1.5" />
            Email
          </TabsTrigger>
          <TabsTrigger value="qr" className="text-xs">
            <QrCode className="h-3 w-3 mr-1.5" />
            QR Code
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="link" className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 p-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <Button
              onClick={handleCopyLink}
              size="sm"
              className="shrink-0"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="flex items-center justify-center" onClick={() => {
              window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
            }}>
              <div className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-2">f</div>
              Facebook
            </Button>
            <Button variant="outline" size="sm" className="flex items-center justify-center" onClick={() => {
              window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent("Check out my wishlist!")}`, '_blank');
            }}>
              <div className="bg-sky-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-2">X</div>
              Twitter
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="email" className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="friend@example.com"
              className="flex-1 p-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <Button
              onClick={handleSendEmail}
              size="sm"
              disabled={!email}
              className="shrink-0"
            >
              <Mail className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            An email invitation will be sent to your friend with a link to your wishlist
          </p>
        </TabsContent>
        
        <TabsContent value="qr" className="flex flex-col items-center">
          <div className="bg-gray-100 p-4 rounded-lg mb-2 w-32 h-32 flex items-center justify-center">
            <QrCode className="w-full h-full text-primary/70" />
          </div>
          <p className="text-xs text-muted-foreground">
            Coming soon: scan this code with your phone to share your wishlist
          </p>
        </TabsContent>
      </Tabs>
      
      <div className="text-xs text-muted-foreground mt-2">
        <p>People with the link can view your public wishlist</p>
      </div>
    </div>
  );
};

export default ShareWishlistOptions;
