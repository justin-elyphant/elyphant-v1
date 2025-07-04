
import React from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, UserPlus, Check, Clock } from "lucide-react";
import { FriendSearchResult } from "@/services/search/friendSearchService";
import { useAuth } from "@/contexts/auth";

interface FriendResultCardProps {
  friend: FriendSearchResult;
  onSendRequest: (friendId: string, friendName: string) => void;
  onViewProfile?: (friendId: string) => void;
}

const FriendResultCard: React.FC<FriendResultCardProps> = ({
  friend,
  onSendRequest,
  onViewProfile
}) => {
  const { user } = useAuth();

  const getConnectionButton = () => {
    if (!user) {
      return (
        <Button size="sm" variant="outline" disabled>
          Sign in to connect
        </Button>
      );
    }

    switch (friend.connectionStatus) {
      case 'connected':
        return (
          <Button size="sm" variant="outline" disabled>
            <Check className="h-4 w-4 mr-1" />
            Connected
          </Button>
        );
      case 'pending':
        return (
          <Button size="sm" variant="outline" disabled>
            <Clock className="h-4 w-4 mr-1" />
            Pending
          </Button>
        );
      default:
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onSendRequest(friend.id, friend.name)}
          >
            <UserPlus className="h-4 w-4 mr-1" />
            Connect
          </Button>
        );
    }
  };

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
        </div>
        {friend.bio && (
          <p className="text-xs text-gray-600 truncate">{friend.bio}</p>
        )}
      </div>
      
      <div className="flex gap-2">
        {getConnectionButton()}
        {onViewProfile && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onViewProfile(friend.id)}
          >
            View
          </Button>
        )}
      </div>
    </div>
  );
};

export default FriendResultCard;
