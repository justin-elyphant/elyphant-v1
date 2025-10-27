import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UnifiedProfileData } from "@/services/profiles/UnifiedProfileService";
import { publicProfileService } from "@/services/publicProfileService";
import PublicProfileTabs from "./PublicProfileTabs";
import PrivacyNotice from "./PrivacyNotice";
import InstagramProfileLayout from "./InstagramProfileLayout";
import ProfileSharingDialog from "./ProfileSharingDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, AlertTriangle, List } from "lucide-react";
import { useProfileSharing } from "@/hooks/useProfileSharing";
import type { PublicProfileData } from "@/services/publicProfileService";

interface MyProfilePreviewProps {
  profile: UnifiedProfileData | null;
}

/**
 * MY PROFILE PREVIEW
 * 
 * Shows users exactly how their profile appears to others.
 * This is the "LinkedIn-style" social proof dashboard that encourages
 * profile completion and helps users understand their public presence.
 */
const MyProfilePreview: React.FC<MyProfilePreviewProps> = ({ profile }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("public-overview");
  const [publicViewData, setPublicViewData] = useState<PublicProfileData | null>(null);
  const [isLoadingPublic, setIsLoadingPublic] = useState(false);

  // Enhanced profile sharing functionality
  const {
    sharingDialogOpen,
    openSharingDialog,
    closeSharingDialog,
    quickShare,
    profileUrl
  } = useProfileSharing({
    profileId: profile?.id || '',
    profileName: (profile as any)?.display_name || (profile as any)?.first_name || (profile as any)?.name || 'User',
    profileUsername: profile?.username
  });

  // Fetch how the profile appears publicly to get accurate privacy-filtered data
  useEffect(() => {
    if (!profile?.username && !profile?.id) return;

    const fetchPublicView = async () => {
      setIsLoadingPublic(true);
      try {
        const publicData = await publicProfileService.getProfileByIdentifier(
          profile.username || profile.id
        );
        setPublicViewData(publicData);
      } catch (error) {
        console.error("Error fetching public view:", error);
      } finally {
        setIsLoadingPublic(false);
      }
    };

    fetchPublicView();
  }, [profile?.username, profile?.id]);

  if (!profile) {
    return (
      <div className="w-full py-10 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Profile Not Found</h1>
          <p className="text-muted-foreground">Unable to load your profile data.</p>
        </div>
      </div>
    );
  }

  const handleShare = () => {
    // Use enhanced sharing - mobile gets native share, desktop gets dialog
    if (navigator.share) {
      quickShare();
    } else {
      openSharingDialog();
    }
  };

  // Calculate profile completeness for social proof
  const calculateCompleteness = () => {
    let completed = 0;
    let total = 6; // Total checkpoints for a complete profile

    if (profile.bio) completed++;
    if (profile.profile_image) completed++;
    if ((profile as any).location) completed++;
    if (profile.gift_preferences && Array.isArray(profile.gift_preferences) && profile.gift_preferences.length > 0) completed++;
    if ((profile as any).wishlist_count && (profile as any).wishlist_count > 0) completed++;
    if ((profile as any).connection_count && (profile as any).connection_count > 0) completed++;

    return Math.round((completed / total) * 100);
  };

  const completeness = calculateCompleteness();
  const needsAttention = completeness < 80;

  // Secondary content for the preview mode
  const secondaryContent = (
    <>
      {/* Manage Wishlists CTA */}
      <div className="mb-6">
        <Button 
          onClick={() => navigate('/wishlists')}
          className="w-full"
          size="lg"
        >
          <List className="mr-2 h-4 w-4" />
          Manage My Wishlists
        </Button>
      </div>

      {/* Privacy Notice */}
      <div className="mb-6">
        <PrivacyNotice 
          level="public" 
          className="w-full"
        />
      </div>
      
      {/* Profile Tabs Preview */}
      <PublicProfileTabs
        profile={profile}
        publicViewData={publicViewData}
        isLoadingPublic={isLoadingPublic}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        completeness={completeness}
      />
    </>
  );

  return (
    <>
      {/* REMOVED: Preview Mode Indicator - Testing for width constraints */}
      {/* REMOVED: Preview Mode Indicator - Testing for width constraints 
      <div className="bg-primary/10 border-b border-primary/20 w-full overflow-x-hidden" style={{ width: '100%', maxWidth: 'none' }}>
        <div className="w-full px-4 py-3 overflow-x-hidden" style={{ width: '100%', maxWidth: 'none' }}>
          <div className="flex items-center justify-between min-w-0">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Eye className="h-5 w-5 text-primary flex-shrink-0" />
              <span className="text-sm font-medium text-primary truncate">
                Profile Preview - This is how others see you
              </span>
              <Badge variant="outline" className="text-xs flex-shrink-0">
                {completeness}% Complete
              </Badge>
            </div>
            {needsAttention && (
              <div className="flex items-center gap-2 text-warning flex-shrink-0 ml-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium hidden sm:inline">Profile needs attention</span>
              </div>
            )}
          </div>
        </div>
      </div>
      */}

      {/* Instagram-style Layout for Profile Preview */}
      <InstagramProfileLayout
        userData={profile}
        profile={profile}
        isCurrentUser={true}
        isConnected={false}
        onConnect={() => {}}
        onShare={handleShare}
        connectionCount={(profile as any).connection_count ?? 0}
        wishlistCount={(profile as any).wishlist_count ?? 0}
        canConnect={false}
        canMessage={false}
        isAnonymousUser={false}
        secondaryContent={secondaryContent}
        secondaryTitle="Profile Details & Privacy Settings"
      />

      {/* Enhanced Profile Sharing Dialog */}
      <ProfileSharingDialog
        open={sharingDialogOpen}
        onOpenChange={closeSharingDialog}
        profileUrl={profileUrl}
        profileName={(profile as any)?.display_name || (profile as any)?.first_name || (profile as any)?.name || 'User'}
        profileUsername={profile?.username}
      />
    </>
  );
};

export default MyProfilePreview;