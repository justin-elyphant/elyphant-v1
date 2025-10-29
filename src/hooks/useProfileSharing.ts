
import { useState, useCallback } from "react";
import { toast } from "sonner";

interface UseProfileSharingProps {
  profileId: string;
  profileName: string;
  profileUsername?: string;
}

export const useProfileSharing = ({ 
  profileId, 
  profileName, 
  profileUsername 
}: UseProfileSharingProps) => {
  const [sharingDialogOpen, setSharingDialogOpen] = useState(false);
  
  // Generate the profile URL
  const profileUrl = `${window.location.origin}/profile/${profileUsername || profileId}`;
  
  const openSharingDialog = useCallback(() => {
    setSharingDialogOpen(true);
  }, []);
  
  const closeSharingDialog = useCallback(() => {
    setSharingDialogOpen(false);
  }, []);
  
  const quickShare = useCallback(async () => {
    const shareData = {
      title: `${profileName}'s Profile`,
      text: `Check out my wishlists on Elyphant! 🎁 Perfect for gift ideas and inspiration.`,
      url: profileUrl,
    };
    
    if (navigator.share) {
      try {
        // Some browsers block Web Share inside iframes (like the preview). Attempt share and fallback on error.
        await navigator.share(shareData);
      } catch (error) {
        console.warn('Web Share failed, falling back to clipboard', error);
        try {
          await navigator.clipboard.writeText(profileUrl);
          const err = error as any;
          const isIframe = typeof window !== 'undefined' && window.self !== window.top;
          const blocked = err?.name === 'NotAllowedError' || isIframe;
          toast.success(blocked 
            ? "Link copied (native share not available in preview)" 
            : "Profile link copied to clipboard!");
        } catch (copyErr) {
          toast.error("Failed to share or copy link");
        }
      }
    } else {
      // Fallback to copying link when Web Share API is not available
      try {
        await navigator.clipboard.writeText(profileUrl);
        toast.success("Profile link copied to clipboard!");
      } catch (error) {
        toast.error("Failed to copy link");
      }
    }
  }, [profileUrl, profileName]);
  
  const copyProfileLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      toast.success("Profile link copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy link");
    }
  }, [profileUrl]);
  
  return {
    profileUrl,
    sharingDialogOpen,
    openSharingDialog,
    closeSharingDialog,
    quickShare,
    copyProfileLink
  };
};
