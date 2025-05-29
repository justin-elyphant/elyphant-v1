
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Share2, 
  Copy, 
  Facebook, 
  Twitter, 
  MessageCircle,
  Mail,
  QrCode,
  Check,
  MessageSquare
} from "lucide-react";
import { toast } from "sonner";

interface ProfileSharingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileUrl: string;
  profileName: string;
  profileUsername?: string;
}

const ProfileSharingDialog = ({ 
  open, 
  onOpenChange, 
  profileUrl, 
  profileName,
  profileUsername 
}: ProfileSharingDialogProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      toast.success("Profile link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const shareText = `Check out ${profileName}'s profile on Gift Giver!`;
  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(profileUrl);

  const shareOptions = [
    {
      name: "Facebook",
      icon: Facebook,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: "bg-blue-600 hover:bg-blue-700"
    },
    {
      name: "X",
      icon: Twitter,
      url: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      color: "bg-black hover:bg-gray-800"
    },
    {
      name: "WhatsApp",
      icon: MessageCircle,
      url: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      color: "bg-green-600 hover:bg-green-700"
    },
    {
      name: "Text",
      icon: MessageSquare,
      url: `sms:?body=${encodedText}%20${encodedUrl}`,
      color: "bg-purple-600 hover:bg-purple-700"
    },
    {
      name: "Email",
      icon: Mail,
      url: `mailto:?subject=${encodeURIComponent(`Check out ${profileName}'s profile`)}&body=${encodedText}%20${encodedUrl}`,
      color: "bg-gray-600 hover:bg-gray-700"
    }
  ];

  const handleSocialShare = (url: string) => {
    window.open(url, '_blank', 'width=600,height=400');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Profile
          </DialogTitle>
          <DialogDescription>
            Share {profileName}'s profile with friends and family
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Direct Link */}
          <div className="space-y-2">
            <Label htmlFor="profile-link">Profile Link</Label>
            <div className="flex gap-2">
              <Input 
                id="profile-link"
                value={profileUrl} 
                readOnly 
                className="flex-1"
              />
              <Button 
                size="sm" 
                onClick={handleCopyLink}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Social Sharing */}
          <div className="space-y-3">
            <Label>Share on Social Media</Label>
            <div className="grid grid-cols-2 gap-2">
              {shareOptions.map((option) => (
                <Button
                  key={option.name}
                  variant="outline"
                  className={`${option.color} text-white border-0`}
                  onClick={() => handleSocialShare(option.url)}
                >
                  <option.icon className="h-4 w-4 mr-2" />
                  {option.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileSharingDialog;
