
import React, { useState } from "react";
import { CopyIcon, Mail, Share2, Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Wishlist } from "@/types/profile";

interface ShareWishlistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wishlist: Wishlist | null;
  onShareSettingsChange: (wishlistId: string, isPublic: boolean) => Promise<boolean>;
}

const ShareWishlistDialog = ({
  open,
  onOpenChange,
  wishlist,
  onShareSettingsChange,
}: ShareWishlistDialogProps) => {
  const [isPublic, setIsPublic] = useState(wishlist?.is_public || false);
  const [shareOption, setShareOption] = useState<"link" | "email">("link");
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset state when dialog opens/closes or wishlist changes
  React.useEffect(() => {
    if (open && wishlist) {
      setIsPublic(wishlist.is_public);
      setCopied(false);
    }
  }, [open, wishlist]);

  // Base URL for sharing
  const baseUrl = window.location.origin;
  const shareUrl = wishlist ? `${baseUrl}/shared-wishlist/${wishlist.id}` : "";

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

  const handleSaveSettings = async () => {
    if (!wishlist) return;
    
    setIsSubmitting(true);
    try {
      const success = await onShareSettingsChange(wishlist.id, isPublic);
      
      if (success) {
        toast.success("Wishlist sharing settings updated");
        onOpenChange(false);
      } else {
        toast.error("Failed to update sharing settings");
      }
    } catch (error) {
      console.error("Error updating wishlist sharing settings:", error);
      toast.error("An error occurred while updating sharing settings");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Share Wishlist</DialogTitle>
          <DialogDescription>
            Share your wishlist "{wishlist?.title}" with friends and family
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Public/Private Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Make wishlist public</h4>
              <p className="text-sm text-muted-foreground">
                Anyone with the link can view this wishlist
              </p>
            </div>
            <Switch
              checked={isPublic}
              onCheckedChange={setIsPublic}
              aria-label="Toggle wishlist public/private"
            />
          </div>

          {/* Sharing Options */}
          <div className="space-y-4">
            <RadioGroup value={shareOption} onValueChange={(value) => setShareOption(value as "link" | "email")}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="link" id="share-link" />
                <Label htmlFor="share-link">Share via link</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="email" id="share-email" />
                <Label htmlFor="share-email">Share via email</Label>
              </div>
            </RadioGroup>

            {shareOption === "link" ? (
              <div className="flex items-center space-x-2">
                <Input 
                  value={shareUrl}
                  readOnly
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyLink}
                  className="shrink-0"
                  disabled={!isPublic}
                >
                  {copied ? <Check className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Input 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  type="email"
                  className="flex-1"
                  disabled={!isPublic}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleSendEmail}
                  className="shrink-0"
                  disabled={!isPublic || !email}
                >
                  <Mail className="h-4 w-4" />
                </Button>
              </div>
            )}

            {!isPublic && (
              <div className="rounded-md bg-yellow-50 p-3">
                <div className="flex">
                  <div className="text-yellow-700">
                    <p className="text-sm">
                      You need to make the wishlist public before sharing.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveSettings}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>Saving...</>
            ) : (
              <>Save Settings</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShareWishlistDialog;
