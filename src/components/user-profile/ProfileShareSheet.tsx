import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Share,
  MessageCircle,
  Mail,
  Copy,
  Check,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { triggerHapticFeedback } from "@/utils/haptics";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Social platform icons as simple components
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

interface ProfileShareSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileName: string;
  profileUrl: string;
  avatarUrl?: string | null;
  wishlistCount?: number;
  itemCount?: number;
}

const ProfileShareSheet = ({
  open,
  onOpenChange,
  profileName,
  profileUrl,
  avatarUrl,
  wishlistCount = 0,
  itemCount = 0,
}: ProfileShareSheetProps) => {
  const [copied, setCopied] = useState(false);

  const generateShareText = () => {
    return `Check out ${profileName}'s wishlists on Elyphant! 🎁 Perfect for gift ideas and inspiration.`;
  };

  const handleNativeShare = async () => {
    triggerHapticFeedback('light');
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profileName}'s Wishlists`,
          text: generateShareText(),
          url: profileUrl,
        });
        onOpenChange(false);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Share failed:', err);
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleTextShare = () => {
    triggerHapticFeedback('light');
    const message = encodeURIComponent(`${generateShareText()}\n\n${profileUrl}`);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const smsUrl = isIOS ? `sms:&body=${message}` : `sms:?body=${message}`;
    window.open(smsUrl, '_blank');
    onOpenChange(false);
  };

  const handleEmailShare = () => {
    triggerHapticFeedback('light');
    const subject = encodeURIComponent(`Check out ${profileName}'s wishlists`);
    const body = encodeURIComponent(`${generateShareText()}\n\n${profileUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
    onOpenChange(false);
  };

  const handleCopyLink = async () => {
    triggerHapticFeedback('medium');
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      toast.success("Profile link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  const handleWhatsAppShare = () => {
    triggerHapticFeedback('light');
    const text = encodeURIComponent(`${generateShareText()}\n\n${profileUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
    onOpenChange(false);
  };

  const handleTwitterShare = () => {
    triggerHapticFeedback('light');
    const text = encodeURIComponent(generateShareText());
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(profileUrl)}`, '_blank');
    onOpenChange(false);
  };

  const handleFacebookShare = () => {
    triggerHapticFeedback('light');
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`, '_blank');
    onOpenChange(false);
  };

  const quickShareOptions = [
    { id: 'native', icon: Share, label: 'Share', action: handleNativeShare },
    { id: 'text', icon: MessageCircle, label: 'Text', action: handleTextShare },
    { id: 'email', icon: Mail, label: 'Email', action: handleEmailShare },
    { id: 'copy', icon: copied ? Check : Copy, label: copied ? 'Copied!' : 'Copy', action: handleCopyLink },
  ];

  const socialOptions = [
    { id: 'whatsapp', icon: WhatsAppIcon, label: 'WhatsApp', color: 'bg-green-500 hover:bg-green-600', action: handleWhatsAppShare },
    { id: 'twitter', icon: XIcon, label: 'X', color: 'bg-black hover:bg-gray-800', action: handleTwitterShare },
    { id: 'facebook', icon: FacebookIcon, label: 'Facebook', color: 'bg-blue-600 hover:bg-blue-700', action: handleFacebookShare },
  ];

  const userInitials = profileName.charAt(0).toUpperCase();

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="pb-[calc(env(safe-area-inset-bottom)+80px)]">
        <DrawerHeader className="text-center pb-2">
          <DrawerTitle className="text-lg font-semibold">Share Your Wishlists</DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-6 space-y-5">
          {/* Profile Preview Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl"
          >
            <Avatar className="h-14 w-14 flex-shrink-0">
              <AvatarImage src={avatarUrl || undefined} alt={profileName} />
              <AvatarFallback className="text-lg bg-primary/10 text-primary">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm truncate">{profileName}'s Wishlists</h3>
              <p className="text-xs text-muted-foreground">
                {wishlistCount} {wishlistCount === 1 ? 'wishlist' : 'wishlists'} • {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </p>
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {profileUrl}
              </p>
            </div>
          </motion.div>

          {/* Quick Share Actions - 4 column grid */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Share Via
            </p>
            <div className="grid grid-cols-4 gap-2">
              {quickShareOptions.map((option, index) => (
                <motion.button
                  key={option.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={option.action}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl",
                    "bg-muted/50 hover:bg-muted active:scale-95 transition-all",
                    "min-h-[72px] touch-manipulation",
                    option.id === 'copy' && copied && "bg-green-100 dark:bg-green-900/30"
                  )}
                >
                  <option.icon className={cn(
                    "h-5 w-5",
                    option.id === 'copy' && copied && "text-green-600"
                  )} />
                  <span className={cn(
                    "text-xs font-medium",
                    option.id === 'copy' && copied && "text-green-600"
                  )}>
                    {option.label}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Social Platforms - 3 column grid */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Social
            </p>
            <div className="grid grid-cols-3 gap-2">
              {socialOptions.map((option, index) => (
                <motion.button
                  key={option.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                  onClick={option.action}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl",
                    "text-white active:scale-95 transition-all",
                    "min-h-[72px] touch-manipulation",
                    option.color
                  )}
                >
                  <option.icon />
                  <span className="text-xs font-medium">{option.label}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default ProfileShareSheet;
