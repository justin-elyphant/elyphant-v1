
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Share2, Calendar, MapPin, Mail } from "lucide-react";
import FollowButton from "./FollowButton";

export interface ProfileBannerProps {
  userData: any;
  isCurrentUser: boolean;
  isFollowing: boolean;
  onFollow: () => void;
  onShare: () => void;
  // New props for real data
  followerCount?: number;
  followingCount?: number;
  wishlistCount?: number;
}

const ProfileBanner: React.FC<ProfileBannerProps> = ({
  userData,
  isCurrentUser,
  isFollowing,
  onFollow,
  onShare,
  followerCount = 0,
  followingCount = 0,
  wishlistCount = 0
}) => {
  const handleMessageClick = () => {
    // Navigate to messaging with this user
    window.location.href = `/messaging/${userData.id}`;
  };

  return (
    <div className="relative">
      {/* Main Banner */}
      <div className="relative h-72 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative flex items-center justify-between p-6 h-full">
          <div className="flex items-center space-x-6">
            {/* Profile Avatar */}
            <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
              <AvatarImage src={userData?.profile_image} alt={userData?.name} />
              <AvatarFallback className="text-2xl font-bold bg-white text-gray-900">
                {userData?.name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
              </AvatarFallback>
            </Avatar>

            {/* Profile Info */}
            <div className="text-white space-y-3">
              <h1 className="text-4xl font-bold">{userData?.name || 'User'}</h1>
              {userData?.username && (
                <p className="text-xl opacity-90">@{userData.username}</p>
              )}
              
              {/* Bio */}
              {userData?.bio && (
                <p className="text-base opacity-90 max-w-md leading-relaxed">{userData.bio}</p>
              )}

              {/* Additional Info */}
              <div className="flex items-center space-x-6 text-sm opacity-90">
                {userData?.location && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span>{userData.location}</span>
                  </div>
                )}
                {userData?.email && !isCurrentUser && (
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4" />
                    <span>{userData.email}</span>
                  </div>
                )}
                {userData?.created_at && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {new Date(userData.created_at).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            {!isCurrentUser && (
              <>
                <FollowButton
                  targetUserId={userData?.id}
                  variant="default"
                  className="bg-white text-gray-900 hover:bg-gray-100"
                />
                <Button
                  onClick={handleMessageClick}
                  variant="outline"
                  className="bg-white/10 border-white text-white hover:bg-white/20"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Message
                </Button>
              </>
            )}
            <Button
              onClick={onShare}
              variant="outline"
              className="bg-white/10 border-white text-white hover:bg-white/20"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Bar - Separate from banner */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="flex justify-center space-x-12 py-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{followingCount}</div>
            <div className="text-base text-gray-600 font-medium">Following</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{followerCount}</div>
            <div className="text-base text-gray-600 font-medium">Followers</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{wishlistCount}</div>
            <div className="text-base text-gray-600 font-medium">Wishlists</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileBanner;
