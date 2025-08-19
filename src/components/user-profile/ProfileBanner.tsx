
import React from "react";
import { Button } from "@/components/ui/button";
import { Share2, Users, Heart, MessageCircle, UserPlus, Gift } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface ProfileBannerProps {
  userData: any;
  isCurrentUser: boolean;
  isConnected: boolean;
  onConnect: () => void;
  onShare: () => void;
  connectionCount: number;
  wishlistCount: number;
  canConnect: boolean;
  canMessage: boolean;
  isAnonymousUser: boolean;
  connectionData?: any;
  onSendGift?: () => void;
  onRemoveConnection?: () => void;
}

const ProfileBanner: React.FC<ProfileBannerProps> = ({
  userData,
  isCurrentUser,
  isConnected,
  onConnect,
  onShare,
  connectionCount,
  wishlistCount,
  canConnect,
  canMessage,
  isAnonymousUser,
  connectionData,
  onSendGift,
  onRemoveConnection
}) => {
  console.log("🏠 ProfileBanner rendering:", {
    userName: userData?.name,
    isCurrentUser,
    isConnected,
    connectionCount,
    wishlistCount,
    userDataWishlistCount: userData?.wishlist_count,
    userDataWishlistsLength: userData?.wishlists?.length,
    hasConnectionData: !!connectionData
  });

  // Calculate wishlist count from multiple possible sources
  const displayWishlistCount = userData?.wishlist_count ?? userData?.wishlists?.length ?? wishlistCount ?? 0;
  
  console.log("🔢 ProfileBanner wishlist count calculation:", {
    userData_wishlist_count: userData?.wishlist_count,
    userData_wishlists_length: userData?.wishlists?.length,
    prop_wishlistCount: wishlistCount,
    final_displayWishlistCount: displayWishlistCount
  });

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="relative">
      <div className="h-48 bg-gradient-to-r from-purple-400 to-pink-400 relative">
        <div className="absolute inset-0 bg-black bg-opacity-20" />
      </div>
      
      <div className="container mx-auto px-4 relative">
        <div className="flex flex-col md:flex-row items-start md:items-end gap-4 -mt-16 pb-6">
          <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
            <AvatarImage src={userData?.profile_image} />
            <AvatarFallback className="text-2xl bg-white text-gray-800">
              {userData?.name ? getInitials(userData.name) : "U"}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 md:ml-4 md:mb-4">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{userData?.name}</h1>
                  {userData?.username && (
                    <p className="text-lg text-gray-600">@{userData.username}</p>
                  )}
                  {userData?.email && (
                    <p className="text-sm text-gray-500 mt-1">📧 {userData.email}</p>
                  )}
                  {userData?.created_at && (
                    <p className="text-sm text-gray-500 mt-1">
                      📅 Joined {new Date(userData.created_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
                
                <div className="flex gap-2 flex-wrap">
                  {!isCurrentUser && canConnect && !isConnected && (
                    <Button onClick={onConnect} className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      Connect
                    </Button>
                  )}
                  
                  {isConnected && onSendGift && (
                    <Button onClick={onSendGift} variant="outline" className="flex items-center gap-2">
                      <Gift className="h-4 w-4" />
                      Send Gift
                    </Button>
                  )}
                  
                  {!isCurrentUser && canMessage && (
                    <Button variant="outline" className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Message
                    </Button>
                  )}
                  
                  <Button variant="outline" onClick={onShare} className="flex items-center gap-2">
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                  
                  {connectionData && onRemoveConnection && (
                    <Button variant="destructive" onClick={onRemoveConnection} size="sm">
                      Remove Connection
                    </Button>
                  )}
                </div>
              </div>
              
              {connectionData && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <Badge variant="secondary" className="mb-2">
                        Connected as {connectionData.relationship || 'Friend'}
                      </Badge>
                      <p className="text-sm text-gray-600">
                        Connected on {new Date(connectionData.connectionDate).toLocaleDateString()}
                      </p>
                    </div>
                    {connectionData.isAutoGiftEnabled && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Auto-Gift Enabled
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex justify-center gap-8 py-4 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{connectionCount}</p>
            <p className="text-sm text-gray-600">Connections</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{displayWishlistCount}</p>
            <p className="text-sm text-gray-600">Wishlists</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileBanner;
