import React from "react";
import { Link } from "react-router-dom";
import { 
  User, 
  MessageCircle, 
  Share2, 
  Settings, 
  Edit,
  MapPin,
  Calendar,
  Users,
  Camera,
  MoreVertical
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ConnectionStatusIndicator from "@/components/messaging/ConnectionStatusIndicator";
import ProfileImageUpload from "@/components/settings/ProfileImageUpload";
import ProfileSharingDialog from "./ProfileSharingDialog";
import FollowButton from "./FollowButton";
import BlockButton from "./BlockButton";
import { formatDate } from "@/utils/date-formatting";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { useProfileSharing } from "@/hooks/useProfileSharing";

interface ProfileBannerProps {
  userData: any;
  isCurrentUser: boolean;
  isFollowing: boolean;
  onFollow: () => void;
  onShare: () => void;
  userStatus?: { status: "online" | "offline" | "away"; lastSeen?: string };
}

const ProfileBanner = ({ 
  userData, 
  isCurrentUser, 
  isFollowing, 
  onFollow, 
  onShare,
  userStatus
}: ProfileBannerProps) => {
  const { updateProfile, refetchProfile } = useProfile();
  const { 
    profileUrl,
    sharingDialogOpen,
    openSharingDialog,
    closeSharingDialog 
  } = useProfileSharing({
    profileId: userData?.id || '',
    profileName: userData?.name || 'User',
    profileUsername: userData?.username
  });
  
  const getInitials = (name?: string): string => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const handleImageUpdate = async (imageUrl: string | null) => {
    try {
      console.log("ProfileBanner handleImageUpdate called with:", imageUrl);
      
      // Update the profile through the context
      await updateProfile({ profile_image: imageUrl });
      
      // Force a complete profile refresh to ensure the UI updates
      await refetchProfile();
      
      // Force a page reload to ensure all components get the new image
      window.location.reload();
      
    } catch (error) {
      console.error("Failed to update profile image:", error);
    }
  };

  const handleShareClick = () => {
    openSharingDialog();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      {/* Cover Image */}
      <div className="h-48 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 relative">
        {/* Action buttons overlay */}
        <div className="absolute top-4 right-4 flex gap-2">
          {isCurrentUser ? (
            <>
              <Button size="sm" variant="secondary" asChild className="backdrop-blur-sm bg-white/90">
                <Link to="/settings">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Link>
              </Button>
              <Button size="sm" variant="secondary" asChild className="backdrop-blur-sm bg-white/90">
                <Link to="/settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </Button>
              <Button size="sm" variant="secondary" onClick={handleShareClick} className="backdrop-blur-sm bg-white/90">
                <Share2 className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <FollowButton 
                targetUserId={userData?.id}
                size="sm"
                className="backdrop-blur-sm bg-white/90"
              />
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" variant="secondary" className="backdrop-blur-sm bg-white/90">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogTitle>Message Feature</DialogTitle>
                  <div className="p-4">
                    <h2 className="text-lg font-bold mb-2">Message Feature</h2>
                    <p>Messaging functionality coming soon!</p>
                  </div>
                </DialogContent>
              </Dialog>
              
              {/* More options dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="secondary" className="backdrop-blur-sm bg-white/90">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleShareClick}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <div className="w-full">
                      <BlockButton 
                        targetUserId={userData?.id} 
                        targetName={userData?.name}
                      />
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>

      {/* Profile Content */}
      <div className="px-6 pb-6">
        {/* Avatar and Basic Info */}
        <div className="flex items-end justify-between -mt-16 mb-4">
          <div className="relative">
            {isCurrentUser ? (
              <div className="relative group">
                <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                  {userData?.profile_image ? (
                    <AvatarImage src={userData.profile_image} alt={userData?.name} />
                  ) : (
                    <AvatarFallback className="bg-purple-100 text-purple-600 text-3xl">
                      {getInitials(userData?.name)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <Dialog>
                  <DialogTrigger asChild>
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer">
                      <Camera className="h-8 w-8 text-white" />
                    </div>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogTitle>Change Profile Picture</DialogTitle>
                    <div className="p-4">
                      <ProfileImageUpload
                        currentImage={userData?.profile_image}
                        name={userData?.name || "User"}
                        onImageUpdate={handleImageUpdate}
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            ) : (
              <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                {userData?.profile_image ? (
                  <AvatarImage src={userData.profile_image} alt={userData?.name} />
                ) : (
                  <AvatarFallback className="bg-purple-100 text-purple-600 text-3xl">
                    {getInitials(userData?.name)}
                  </AvatarFallback>
                )}
              </Avatar>
            )}
            
            {/* Status indicator */}
            {userStatus && (
              <div className="absolute bottom-2 right-2">
                <ConnectionStatusIndicator 
                  status={userStatus.status}
                  lastSeen={userStatus.lastSeen}
                  size="lg"
                  className="bg-white rounded-full p-1"
                />
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex gap-6 text-center">
            <div>
              <div className="text-2xl font-bold">127</div>
              <div className="text-sm text-muted-foreground">Following</div>
            </div>
            <div>
              <div className="text-2xl font-bold">256</div>
              <div className="text-sm text-muted-foreground">Followers</div>
            </div>
            <div>
              <div className="text-2xl font-bold">12</div>
              <div className="text-sm text-muted-foreground">Wishlists</div>
            </div>
          </div>
        </div>

        {/* Name and Bio */}
        <div className="space-y-2">
          <div>
            <h1 className="text-2xl font-bold">{userData?.name}</h1>
            {userData?.username && (
              <p className="text-muted-foreground">@{userData.username}</p>
            )}
          </div>
          
          {userData?.bio && (
            <p className="text-gray-700 max-w-2xl">{userData.bio}</p>
          )}

          {/* Quick Info */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground pt-2">
            {userData?.shipping_address?.city && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{userData.shipping_address.city}, {userData.shipping_address.state}</span>
              </div>
            )}
            
            {userData?.dob && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Born {formatDate(userData.dob)}</span>
              </div>
            )}
            
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>Joined January 2024</span>
            </div>
          </div>

          {/* Interest Badges */}
          {userData?.gift_preferences && userData.gift_preferences.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-3">
              {userData.gift_preferences.slice(0, 5).map((pref: any, index: number) => (
                <Badge key={index} variant="secondary" className="bg-purple-50 text-purple-700">
                  {typeof pref === 'string' ? pref : pref.category}
                </Badge>
              ))}
              {userData.gift_preferences.length > 5 && (
                <Badge variant="outline">+{userData.gift_preferences.length - 5} more</Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Profile Sharing Dialog */}
      <ProfileSharingDialog
        open={sharingDialogOpen}
        onOpenChange={closeSharingDialog}
        profileUrl={profileUrl}
        profileName={userData?.name || 'User'}
        profileUsername={userData?.username}
      />
    </div>
  );
};

export default ProfileBanner;
