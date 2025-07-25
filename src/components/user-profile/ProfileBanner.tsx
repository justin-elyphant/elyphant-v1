
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Share2, Calendar, MapPin, Mail, UserPlus, Lock } from "lucide-react";
import ConnectButton from "./ConnectButton";
import { Link } from "react-router-dom";
import { navigateInIframe } from "@/utils/iframeUtils";

export interface ProfileBannerProps {
  userData: any;
  isCurrentUser: boolean;
  isConnected: boolean;
  onConnect: () => void;
  onShare: () => void;
  // Real data props
  connectionCount?: number;
  wishlistCount?: number;
  // New props for public profile handling
  canConnect?: boolean;
  canMessage?: boolean;
  isAnonymousUser?: boolean;
}

const ProfileBanner: React.FC<ProfileBannerProps> = ({
  userData,
  isCurrentUser,
  isConnected,
  onConnect,
  onShare,
  connectionCount = 0,
  wishlistCount = 0,
  canConnect = true,
  canMessage = true,
  isAnonymousUser = false
}) => {
  // Privacy logic for email display
  const shouldShowEmail = () => {
    // Always show for current user
    if (isCurrentUser) return true;
    
    // Hide email if user doesn't have email data
    if (!userData?.email) return false;
    
    // Check data sharing settings for email
    const emailSetting = userData?.data_sharing_settings?.email;
    
    // If set to private, never show
    if (emailSetting === 'private') return false;
    
    // If set to friends only, show only to connected users
    if (emailSetting === 'friends') return isConnected;
    
    // If set to public or no setting, show to authenticated users only (not anonymous)
    return !isAnonymousUser;
  };
  const handleMessageClick = () => {
    if (isAnonymousUser) {
      // Redirect to signup with intent
      sessionStorage.setItem('elyphant-post-signup-action', JSON.stringify({
        type: 'message',
        targetUserId: userData.id,
        targetName: userData.name
      }));
      navigateInIframe('/signup');
      return;
    }
    
    // Navigate to messaging with this user using iframe-safe navigation
    navigateInIframe(`/messages/${userData.id}`);
  };

  const handleConnectClick = () => {
    if (isAnonymousUser) {
      // Redirect to signup with intent to connect
      sessionStorage.setItem('elyphant-post-signup-action', JSON.stringify({
        type: 'connect',
        targetUserId: userData.id,
        targetName: userData.name
      }));
      navigateInIframe('/signup');
      return;
    }
    
    onConnect();
  };

  const renderActionButtons = () => {
    if (isCurrentUser) {
      return (
        <Button
          onClick={onShare}
          variant="outline"
          className="bg-white/10 border-white text-white hover:bg-white/20"
        >
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      );
    }

    if (isAnonymousUser) {
      return (
        <div className="flex space-x-3">
          {canConnect && (
            <Button
              onClick={handleConnectClick}
              className="bg-white text-gray-900 hover:bg-gray-100"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Connect
            </Button>
          )}
          {canMessage && (
            <Button
              onClick={handleMessageClick}
              variant="outline"
              className="bg-white/10 border-white text-white hover:bg-white/20"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Message
            </Button>
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
      );
    }

    // Authenticated user viewing someone else's profile
    return (
      <div className="flex space-x-3">
        {canConnect && (
          <ConnectButton
            targetUserId={userData?.id}
            variant="default"
            className="bg-white text-gray-900 hover:bg-gray-100"
          />
        )}
        {canMessage && (
          <Button
            onClick={handleMessageClick}
            variant="outline"
            className="bg-white/10 border-white text-white hover:bg-white/20"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Message
          </Button>
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
    );
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
              <div className="flex items-center space-x-3">
                <h1 className="text-4xl font-bold">{userData?.name || 'User'}</h1>
                {!isCurrentUser && !canConnect && (
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    <Lock className="h-3 w-3 mr-1" />
                    Private
                  </Badge>
                )}
                {isAnonymousUser && (
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    Public Profile
                  </Badge>
                )}
              </div>
              
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
                {shouldShowEmail() && (
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

              {/* Sign up prompt for anonymous users */}
              {isAnonymousUser && (
                <div className="mt-4 p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                  <p className="text-sm font-medium">Want to connect with {userData.name}?</p>
                  <Link 
                    to="/signup" 
                    className="text-sm underline hover:no-underline"
                    onClick={() => {
                      sessionStorage.setItem('elyphant-post-signup-action', JSON.stringify({
                        type: 'view_profile',
                        targetUserId: userData.id,
                        targetName: userData.name
                      }));
                    }}
                  >
                    Sign up to connect and message
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            {renderActionButtons()}
          </div>
        </div>
      </div>

      {/* Stats Bar - Separate from banner */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="flex justify-center space-x-12 py-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{connectionCount}</div>
            <div className="text-base text-gray-600 font-medium">Connections</div>
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
