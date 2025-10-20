import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, UserPlus, Check, Clock, Lock, Users, Globe, LogIn } from "lucide-react";
import { FriendSearchResult } from "@/services/search/friendSearchService";
import { getConnectionPermissions } from "@/services/search/privacyAwareFriendSearch";
import { checkConnectionStatus } from "@/services/search/friendSearchService";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";

interface FriendResultCardProps {
  friend: FriendSearchResult;
  onSendRequest: (friendId: string, friendName: string) => void;
  onViewProfile?: (profileIdentifier: string) => void;
}

const FriendResultCard: React.FC<FriendResultCardProps> = ({
  friend,
  onSendRequest,
  onViewProfile
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [connectionStatus, setConnectionStatus] = useState(friend.connectionStatus);
  const [permissions, setPermissions] = useState({
    canSendRequest: true,
    canViewProfile: true,
    canMessage: true,
    restrictionReason: undefined as string | undefined
  });
  const [isLoading, setIsLoading] = useState(false);

  // Check connection status and permissions on mount
  useEffect(() => {
    const checkPermissions = async () => {
      if (user && friend.id) {
        const [status, perms] = await Promise.all([
          checkConnectionStatus(user.id, friend.id),
          getConnectionPermissions(friend.id, user.id)
        ]);
        setConnectionStatus(status);
        setPermissions(prev => ({ ...prev, ...perms }));
      }
    };

    checkPermissions();
  }, [user, friend.id]);

  const handleSendRequest = async () => {
    if (!permissions.canSendRequest) {
      toast.error(permissions.restrictionReason || "Cannot send connection request");
      return;
    }

    setIsLoading(true);
    try {
      await onSendRequest(friend.id, friend.name);
      setConnectionStatus('pending');
    } finally {
      setIsLoading(false);
    }
  };

  const getPrivacyIcon = () => {
    switch (friend.privacyLevel) {
      case 'public':
        return <Globe className="h-3 w-3 text-green-500" />;
      case 'limited':
        return <Users className="h-3 w-3 text-blue-500" />;
      case 'private':
        return <Lock className="h-3 w-3 text-gray-500" />;
      default:
        return null;
    }
  };

  const getPrivacyLabel = () => {
    switch (friend.privacyLevel) {
      case 'public':
        return 'Public Profile';
      case 'limited':
        return 'Limited Profile';
      case 'private':
        return 'Private Profile';
      default:
        return '';
    }
  };

  const getConnectionButton = () => {
    if (!user) {
      return (
        <Button 
          type="button"
          size="sm" 
          variant="outline" 
          onClick={() => navigate(`/signin?redirect=${encodeURIComponent(window.location.pathname)}`)}
        >
          <LogIn className="h-4 w-4 mr-1" />
          Sign in to connect
        </Button>
      );
    }

    // Priority 1: Check connection status first
    switch (connectionStatus) {
      case 'connected':
        return (
          <Button type="button" size="sm" variant="outline" disabled className="border-green-200 bg-green-50 text-green-700">
            <Check className="h-4 w-4 mr-1" />
            Connected
          </Button>
        );
      case 'pending':
        return (
          <Button type="button" size="sm" variant="outline" disabled className="border-amber-200 bg-amber-50 text-amber-700">
            <Clock className="h-4 w-4 mr-1" />
            Pending
          </Button>
        );
      default:
        // Priority 2: Only check permissions for non-connected users
        if (!permissions.canSendRequest) {
          return (
            <Button type="button" size="sm" variant="outline" disabled title={permissions.restrictionReason}>
              <Lock className="h-4 w-4 mr-1" />
              Restricted
            </Button>
          );
        }
        
        // Priority 3: Show connect button
        return (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleSendRequest}
            disabled={isLoading}
          >
            <UserPlus className="h-4 w-4 mr-1" />
            {isLoading ? 'Sending...' : 'Connect'}
          </Button>
        );
    }
  };

  const shouldShowLocation = user && (friend.city || friend.state) && !friend.isPrivacyRestricted;
  const shouldShowBio = friend.bio && (friend.privacyLevel === 'public' || connectionStatus === 'connected');

  return (
    <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
      <Avatar className="h-10 w-10">
        <AvatarImage src={friend.profile_image} alt={friend.name} />
        <AvatarFallback>
          <User className="h-5 w-5" />
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-sm truncate">{friend.name}</h3>
          {friend.username && (
            <span className="text-xs text-gray-500">@{friend.username}</span>
          )}
          {friend.privacyLevel && (
            <div className="flex items-center gap-1" title={getPrivacyLabel()}>
              {getPrivacyIcon()}
            </div>
          )}
        </div>
        
        {shouldShowLocation && (
          <p className="text-xs text-gray-500 truncate">
            {[friend.city, friend.state].filter(Boolean).join(', ')}
          </p>
        )}
        
        {shouldShowBio && (
          <p className="text-xs text-gray-600 truncate">{friend.bio}</p>
        )}
        
        {friend.mutualConnections && friend.mutualConnections > 0 && (
          <p className="text-xs text-blue-600">
            {friend.mutualConnections} mutual connection{friend.mutualConnections !== 1 ? 's' : ''}
          </p>
        )}
        
        {friend.lastActive && connectionStatus === 'connected' && (
          <p className="text-xs text-gray-500">{friend.lastActive}</p>
        )}
        
        {friend.isPrivacyRestricted && connectionStatus === 'none' && (
          <Badge variant="secondary" className="text-xs">
            Limited visibility
          </Badge>
        )}
      </div>
      
      <div className="flex gap-2">
        {getConnectionButton()}
        {onViewProfile && permissions.canViewProfile && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => onViewProfile(friend.username || friend.id)}
          >
            View
          </Button>
        )}
      </div>
    </div>
  );
};

export default FriendResultCard;
