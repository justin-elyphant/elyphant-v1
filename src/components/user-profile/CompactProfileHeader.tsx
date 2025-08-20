import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Share2, MapPin, Mail, UserPlus, Lock, Gift, Heart, Users } from "lucide-react";
import ConnectButton from "./ConnectButton";
import { Link } from "react-router-dom";
import { navigateInIframe } from "@/utils/iframeUtils";
import { getRelationshipIcon, getRelationshipLabel } from "@/components/connections/RelationshipUtils";

interface CompactProfileHeaderProps {
  userData: any;
  isCurrentUser: boolean;
  isConnected: boolean;
  onConnect: () => void;
  onShare: () => void;
  connectionCount?: number;
  wishlistCount?: number;
  canConnect?: boolean;
  canMessage?: boolean;
  isAnonymousUser?: boolean;
  connectionData?: {
    relationship?: string;
    customRelationship?: string;
    connectionDate?: string;
    isAutoGiftEnabled?: boolean;
    canRemoveConnection?: boolean;
  };
  onSendGift?: () => void;
  onRemoveConnection?: () => void;
}

const CompactProfileHeader: React.FC<CompactProfileHeaderProps> = ({
  userData,
  isCurrentUser,
  isConnected,
  onConnect,
  onShare,
  connectionCount = 0,
  wishlistCount = 0,
  canConnect = true,
  canMessage = true,
  isAnonymousUser = false,
  connectionData,
  onSendGift,
  onRemoveConnection
}) => {
  // Privacy logic for email display
  const shouldShowEmail = () => {
    if (isCurrentUser) return true;
    if (!userData?.email) return false;
    
    const emailSetting = userData?.data_sharing_settings?.email;
    if (emailSetting === 'private') return false;
    if (emailSetting === 'friends') return isConnected;
    return !isAnonymousUser;
  };

  const handleMessageClick = () => {
    if (isAnonymousUser) {
      sessionStorage.setItem('elyphant-post-signup-action', JSON.stringify({
        type: 'message',
        targetUserId: userData.id,
        targetName: userData.name
      }));
      navigateInIframe('/signup');
      return;
    }
    navigateInIframe(`/messages/${userData.id}`);
  };

  const handleConnectClick = () => {
    if (isAnonymousUser) {
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
          size="sm"
          className="bg-white/10 border-white text-white hover:bg-white/20"
        >
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      );
    }

    return (
      <div className="flex gap-2">
        {canConnect && !isConnected && !isAnonymousUser && (
          <ConnectButton
            targetUserId={userData?.id}
            variant="default"
            size="sm"
            className="bg-white text-gray-900 hover:bg-gray-100"
          />
        )}
        {isConnected && onSendGift && (
          <Button
            onClick={onSendGift}
            variant="default"
            size="sm"
            className="bg-white text-gray-900 hover:bg-gray-100"
          >
            <Gift className="h-4 w-4 mr-2" />
            Gift
          </Button>
        )}
        {canMessage && (
          <Button
            onClick={handleMessageClick}
            variant="outline"
            size="sm"
            className="bg-white/10 border-white text-white hover:bg-white/20"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Message
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="sticky top-0 z-10 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500">
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative flex items-center justify-between p-4 lg:px-6">
        <div className="flex items-center gap-4">
          {/* Profile Avatar */}
          <Avatar className="w-16 h-16 border-2 border-white shadow-lg">
            <AvatarImage src={userData?.profile_image} alt={userData?.name} />
            <AvatarFallback className="text-lg font-bold bg-white text-gray-900">
              {userData?.name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
            </AvatarFallback>
          </Avatar>

          {/* Profile Info */}
          <div className="text-white min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl lg:text-2xl font-bold truncate">{userData?.name || 'User'}</h1>
              {connectionData?.isAutoGiftEnabled && (
                <Badge variant="secondary" className="bg-green-500/20 text-green-100 border-green-300/30 text-xs">
                  Auto-Gift
                </Badge>
              )}
              {!isCurrentUser && !canConnect && (
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  <Lock className="h-3 w-3 mr-1" />
                  Private
                </Badge>
              )}
            </div>
            
            {userData?.username && (
              <p className="text-sm opacity-90 mb-2">@{userData.username}</p>
            )}
            
            {/* Bio - single line with truncation */}
            {userData?.bio && (
              <p className="text-sm opacity-90 truncate max-w-md">{userData.bio}</p>
            )}
            
            {/* Connection relationship info */}
            {connectionData?.relationship && (
              <div className="flex items-center gap-2 mt-1">
                {getRelationshipIcon(connectionData.relationship as any)}
                <span className="text-xs font-medium opacity-90">
                  {getRelationshipLabel(connectionData.relationship as any, connectionData.customRelationship)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Stats and Actions */}
        <div className="flex items-center gap-4">
          {/* Stats */}
          <div className="hidden sm:flex items-center gap-4 text-white">
            <button className="text-center hover:opacity-80 transition-opacity">
              <div className="text-lg font-bold">{connectionCount}</div>
              <div className="text-xs opacity-90">connections</div>
            </button>
            <button className="text-center hover:opacity-80 transition-opacity">
              <div className="text-lg font-bold">{wishlistCount}</div>
              <div className="text-xs opacity-90">wishlists</div>
            </button>
          </div>

          {/* Action Buttons */}
          {renderActionButtons()}
        </div>
      </div>

      {/* Mobile Stats Row */}
      <div className="sm:hidden relative px-4 pb-3">
        <div className="flex justify-center gap-8 text-white">
          <div className="text-center">
            <div className="text-lg font-bold">{connectionCount}</div>
            <div className="text-xs opacity-90">connections</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">{wishlistCount}</div>
            <div className="text-xs opacity-90">wishlists</div>
          </div>
        </div>
      </div>

      {/* Sign up prompt for anonymous users */}
      {isAnonymousUser && (
        <div className="relative mx-4 mb-4 p-3 bg-white/10 rounded-lg backdrop-blur-sm">
          <p className="text-sm font-medium text-white">Want to connect with {userData.name}?</p>
          <Link 
            to="/signup" 
            className="text-sm text-white underline hover:no-underline"
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
  );
};

export default CompactProfileHeader;