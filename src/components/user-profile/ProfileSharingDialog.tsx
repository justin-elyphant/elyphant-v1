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
  Check,
  MessageSquare
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { triggerHapticFeedback, HapticPatterns } from "@/utils/haptics";

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
    triggerHapticFeedback(HapticPatterns.buttonTap);
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      triggerHapticFeedback('success');
      toast.success("Profile link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      triggerHapticFeedback('error');
      toast.error("Failed to copy link");
    }
  };

  const shareText = `Join me on Elyphant so we can see each other's wishlists! Perfect for birthdays, holidays, or just because gifts 💝`;
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
      url: `mailto:?subject=${encodeURIComponent(`Join me on Elyphant!`)}&body=${encodedText}%20${encodedUrl}`,
      color: "bg-gray-600 hover:bg-gray-700"
    }
  ];

  const handleSocialShare = (url: string) => {
    triggerHapticFeedback(HapticPatterns.buttonTap);
    window.open(url, '_blank', 'width=600,height=400');
  };

  const handleClose = () => {
    triggerHapticFeedback('light');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md pb-safe">
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
                className="flex-1 min-h-[44px]"
              />
              <motion.div whileTap={{ scale: 0.95 }}>
                <Button 
                  size="sm" 
                  onClick={handleCopyLink}
                  className="shrink-0 min-h-[44px] min-w-[44px]"
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </motion.div>
            </div>
          </div>

          <Separator />

          {/* Social Sharing */}
          <div className="space-y-3">
            <Label>Share on Social Media</Label>
            <div className="grid grid-cols-2 gap-2">
              {shareOptions.map((option) => (
                <motion.div key={option.name} whileTap={{ scale: 0.97 }}>
                  <Button
                    variant="outline"
                    className={`${option.color} text-white border-0 min-h-[44px] w-full`}
                    onClick={() => handleSocialShare(option.url)}
                  >
                    <option.icon className="h-4 w-4 mr-2" />
                    {option.name}
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <motion.div whileTap={{ scale: 0.97 }}>
            <Button variant="ghost" onClick={handleClose} className="min-h-[44px]">
              Close
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileSharingDialog;
