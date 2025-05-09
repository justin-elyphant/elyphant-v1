
import React, { useState } from "react";
import { CopyIcon, Mail, Check, X } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface SharingOptionsProps {
  isPublic: boolean;
  wishlistId: string;
}

const SharingOptions = ({ isPublic, wishlistId }: SharingOptionsProps) => {
  const [shareOption, setShareOption] = useState<"link" | "email">("link");
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
  );
};

export default SharingOptions;
