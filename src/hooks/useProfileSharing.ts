
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
        await navigator.share(shareData);
      } catch (error) {
        console.log('Share cancelled or failed');
      }
    } else {
      // Fallback to copying link
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
