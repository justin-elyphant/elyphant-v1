import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MessageCircle, Share2, MapPin, Mail, UserPlus, Lock, Gift, Heart, Users, Settings, Eye, ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import ConnectButton from "./ConnectButton";
import { Link } from "react-router-dom";
import { navigateInIframe } from "@/utils/iframeUtils";
import { getRelationshipIcon, getRelationshipLabel } from "@/components/connections/RelationshipUtils";
import { useIsMobile } from "@/hooks/use-mobile";

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
  isPreviewMode?: boolean;
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
  isPreviewMode = false,
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
      navigateInIframe('/signup');
      return;
    }
    navigateInIframe(`/messages/${userData.id}`);
  };

  const handleConnectClick = () => {
    if (isAnonymousUser) {
      navigateInIframe('/signup');
      return;
    }
    onConnect();
  };

  const isMobile = useIsMobile();

  const renderActionButtons = () => {
    // In preview mode, hide owner-specific actions and show public view
    if (isCurrentUser && !isPreviewMode) {
      const buttonSize = isMobile ? "icon" : "sm";
      const buttonClass = "bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm";
      const gapClass = isMobile ? "gap-2" : "gap-3";
      
      return (
        <div className={`flex flex-wrap ${gapClass}`}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => navigateInIframe('/settings')}
                  variant="outline"
                  size={buttonSize}
                  className={buttonClass}
                >
                  <Settings className="h-4 w-4" />
                  {!isMobile && <span className="ml-2">Edit Profile</span>}
                </Button>
              </TooltipTrigger>
              {isMobile && (
                <TooltipContent>
                  <p>Edit Profile</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size={buttonSize}
                className={buttonClass}
              >
                <Share2 className="h-4 w-4" />
                {!isMobile && <span className="ml-2">Share</span>}
                {!isMobile && <ChevronDown className="h-4 w-4 ml-1" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-background border shadow-md z-[70]">
              <DropdownMenuItem 
                onClick={() => {
                  const publicUrl = `/profile/@${userData?.username || userData?.id}`;
                  window.open(publicUrl, '_blank');
                }}
                className="cursor-pointer"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Public Profile
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={onShare}
                className="cursor-pointer"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share Profile Link
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    }

    const buttonSize = isMobile ? "icon" : "sm";
    const gapClass = isMobile ? "gap-2" : "gap-3";
    
    return (
      <div className={`flex flex-wrap ${gapClass}`}>
        {canConnect && !isConnected && !isAnonymousUser && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <ConnectButton
                  targetUserId={userData?.id}
                  variant="default"
                  size={buttonSize}
                  className="bg-white text-gray-900 hover:bg-gray-100 rounded-full"
                  iconOnly={isMobile}
                />
              </TooltipTrigger>
              {isMobile && (
                <TooltipContent>
                  <p>Connect</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        )}
        {isConnected && onSendGift && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={onSendGift}
                  variant="default"
                  size={buttonSize}
                  className="bg-white text-gray-900 hover:bg-gray-100 rounded-full"
                >
                  <Gift className="h-4 w-4" />
                  {!isMobile && <span className="ml-2">Gift</span>}
                </Button>
              </TooltipTrigger>
              {isMobile && (
                <TooltipContent>
                  <p>Send Gift</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        )}
        {canMessage && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleMessageClick}
                  variant="outline"
                  size={buttonSize}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm rounded-full"
                >
                  <MessageCircle className="h-4 w-4" />
                  {!isMobile && <span className="ml-2">Message</span>}
                </Button>
              </TooltipTrigger>
              {isMobile && (
                <TooltipContent>
                  <p>Send Message</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        )}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onShare}
                variant="outline"
                size={buttonSize}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm rounded-full"
              >
                <Share2 className="h-4 w-4" />
                {!isMobile && <span className="ml-2">Share</span>}
              </Button>
            </TooltipTrigger>
            {isMobile && (
              <TooltipContent>
                <p>Share Profile</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  };

  return (
    <div className="sticky top-0 z-[60] bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 w-full overflow-x-hidden" style={{ width: '100%', maxWidth: 'none' }}>
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative flex items-center justify-between p-4 lg:px-6 min-w-0 overflow-x-hidden w-full" style={{ width: '100%', maxWidth: 'none' }}>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Profile Avatar */}
          <Avatar className="w-14 h-14 sm:w-16 sm:h-16 border-2 border-white shadow-lg flex-shrink-0">
            <AvatarImage src={userData?.profile_image} alt={userData?.name} />
            <AvatarFallback className="text-lg font-bold bg-white text-gray-900">
              {userData?.name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
            </AvatarFallback>
          </Avatar>

          {/* Profile Info */}
          <div className="text-white min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 min-w-0">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold truncate min-w-0">{userData?.name || 'User'}</h1>
              <div className="flex gap-1 flex-shrink-0">
                {/* Gift Mode Indicator for visitors */}
                {!isCurrentUser && !isAnonymousUser && (
                  <Badge variant="secondary" className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-white border-white/30 text-xs">
                    🎁 Gift Mode
                  </Badge>
                )}
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
            </div>
            
            {userData?.username && (
              <p className="text-sm opacity-90 mb-1 truncate">@{userData.username}</p>
            )}
            
            {/* Bio - single line with truncation */}
            {userData?.bio && (
              <p className="text-sm opacity-90 truncate">{userData.bio}</p>
            )}
            
            {/* Connection relationship info */}
            {connectionData?.relationship && (
              <div className="flex items-center gap-2 mt-1 min-w-0">
                {getRelationshipIcon(connectionData.relationship as any)}
                <span className="text-xs font-medium opacity-90 truncate">
                  {getRelationshipLabel(connectionData.relationship as any, connectionData.customRelationship)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Stats and Actions */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-wrap justify-end pr-4 md:pr-6">
          {/* Enhanced Stats with Social Proof */}
          <div className="hidden sm:flex items-center gap-4 text-white">
            <button className="text-center hover:opacity-80 transition-opacity">
              <div className="text-lg font-bold">{connectionCount}</div>
              <div className="text-xs opacity-90">
                {connectionCount === 1 ? 'connection' : 'connections'}
              </div>
            </button>
            <button className="text-center hover:opacity-80 transition-opacity">
              <div className="text-lg font-bold">{wishlistCount}</div>
              <div className="text-xs opacity-90">
                {wishlistCount === 1 ? 'wishlist' : 'wishlists'}
              </div>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex px-2">
            {renderActionButtons()}
          </div>
        </div>
      </div>

      {/* Mobile Stats Row with Social Proof */}
      <div className="sm:hidden relative px-4 pb-3">
        <div className="flex justify-center gap-8 text-white">
          <div className="text-center">
            <div className="text-lg font-bold">{connectionCount}</div>
            <div className="text-xs opacity-90">
              {connectionCount === 1 ? 'connection' : 'connections'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">{wishlistCount}</div>
            <div className="text-xs opacity-90">
              {wishlistCount === 1 ? 'wishlist' : 'wishlists'}
            </div>
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
          >
            Sign up to connect and message
          </Link>
        </div>
      )}
    </div>
  );
};

export default CompactProfileHeader;