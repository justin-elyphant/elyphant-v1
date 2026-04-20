import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Heart, UserPlus, Check, X, MoreHorizontal, Sparkles } from "lucide-react";
import { Connection } from "@/types/connections";
import { triggerHapticFeedback } from "@/utils/haptics";

interface OptimizedMobileConnectionCardProps {
  connection: Connection;
  onRelationshipEdit?: () => void;
  onAccept?: (connectionId: string) => void;
  onDecline?: (connectionId: string) => void;
  onConnect?: (connectionId: string) => void;
  isPending?: boolean;
  isSuggestion?: boolean;
}

export const OptimizedMobileConnectionCard: React.FC<OptimizedMobileConnectionCardProps> = ({
  connection,
  onRelationshipEdit,
  onAccept,
  onDecline,
  onConnect,
  isPending = false,
  isSuggestion = false
}) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCardTap = () => {
    triggerHapticFeedback('light');
    setIsExpanded(!isExpanded);
  };

  const handleMessage = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHapticFeedback('impact');
    navigate(`/messages/${connection.id}`);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHapticFeedback('impact');
    navigate(`/profile/${connection.username}`);
  };


  const handleAccept = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHapticFeedback('impact');
    onAccept?.(connection.id);
  };

  const handleDecline = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHapticFeedback('impact');
    onDecline?.(connection.id);
  };

  const handleConnect = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHapticFeedback('impact');
    onConnect?.(connection.id);
  };

  const getStatusBadge = () => {
    if (isPending) {
      return <Badge variant="secondary" className="text-xs">Pending</Badge>;
    }
    if (isSuggestion) {
      return <Badge variant="outline" className="text-xs">Suggested</Badge>;
    }
    if (connection.relationship && connection.relationship !== 'friend') {
      return (
        <Badge variant="secondary" className="text-xs capitalize">
          {connection.customRelationship || connection.relationship}
        </Badge>
      );
    }
    return null;
  };

  const renderActionButtons = () => {
    if (isPending) {
      return (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="connection-action-button flex-1"
            onClick={handleAccept}
          >
            <Check className="h-4 w-4 mr-1" />
            Accept
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="connection-action-button"
            onClick={handleDecline}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      );
    }

    if (isSuggestion) {
      return (
        <Button
          size="sm"
          variant="outline"
          className="connection-action-button"
          onClick={handleConnect}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Connect
        </Button>
      );
    }

    return (
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="connection-action-button flex-1"
          onClick={handleMessage}
        >
          <MessageCircle className="h-4 w-4 mr-1" />
          Message
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="connection-action-button flex-1"
          onClick={handleWishlist}
        >
          <Heart className="h-4 w-4 mr-1" />
          {connection.name.split(' ')[0]}'s Wishlist
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="connection-action-button px-2"
          onClick={(e) => {
            e.stopPropagation();
            onRelationshipEdit?.();
          }}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  return (
    <>
      <div
        className={`connection-card bg-card border border-border rounded-xl p-4 transition-all duration-200 ${
          isExpanded ? 'ring-2 ring-primary/20' : ''
        }`}
        onClick={handleCardTap}
      >
        <div className="flex items-center space-x-3">
          {/* Avatar */}
          <Avatar className="connection-avatar">
            <AvatarImage src={connection.imageUrl} alt={connection.name} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {connection.name.charAt(0)}
            </AvatarFallback>
          </Avatar>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-foreground truncate">
                {connection.name}
              </h3>
              {getStatusBadge()}
              {(connection as any).hasPendingGift && (
                <Badge variant="secondary" className="gap-1 text-[10px] px-1.5 py-0.5 h-4">
                  <Sparkles className="h-2.5 w-2.5" />
                  Gift
                </Badge>
              )}
            </div>

            <p className="text-sm text-muted-foreground truncate mb-1">
              {connection.username}
            </p>

            {connection.mutualFriends > 0 && (
              <p className="text-xs text-muted-foreground">
                {connection.mutualFriends} mutual connections
              </p>
            )}
          </div>

          {/* Chevron indicator */}
          <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
            <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-4 space-y-3 animate-accordion-down">
            {connection.bio && (
              <p className="text-sm text-muted-foreground">{connection.bio}</p>
            )}

            {connection.interests && connection.interests.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {connection.interests.slice(0, 3).map((interest) => (
                  <Badge key={interest} variant="secondary" className="text-xs">
                    {interest}
                  </Badge>
                ))}
                {connection.interests.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{connection.interests.length - 3} more
                  </Badge>
                )}
              </div>
            )}

            {connection.lastActive && (
              <p className="text-xs text-muted-foreground">
                Active {connection.lastActive}
              </p>
            )}

            <div className="pt-2" onClick={(e) => e.stopPropagation()}>
              {renderActionButtons()}
            </div>
          </div>
        )}
      </div>

    </>
  );
};
