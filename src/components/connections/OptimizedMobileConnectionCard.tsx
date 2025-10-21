import React, { useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Gift, UserPlus, Check, X, MoreHorizontal, Sparkles } from "lucide-react";
import { Connection } from "@/types/connections";
import { triggerHapticFeedback } from "@/utils/haptics";

interface OptimizedMobileConnectionCardProps {
  connection: Connection;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onRelationshipEdit?: () => void;
  isPending?: boolean;
  isSuggestion?: boolean;
}

export const OptimizedMobileConnectionCard: React.FC<OptimizedMobileConnectionCardProps> = ({
  connection,
  onSwipeLeft,
  onSwipeRight,
  onRelationshipEdit,
  isPending = false,
  isSuggestion = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const swipeRef = useRef<HTMLDivElement>(null);
  const [isTracking, setIsTracking] = useState(false);
  
  // Use a simplified swipe detection instead of the hook for now
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsTracking(true);
  };
  
  const handleTouchEnd = () => {
    setIsTracking(false);
  };

  const handleCardTap = () => {
    triggerHapticFeedback('light');
    setIsExpanded(!isExpanded);
  };

  const handleActionTap = (action: string, e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHapticFeedback('impact');
    console.log(`${action} action for:`, connection.name);
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
            onClick={(e) => handleActionTap('accept', e)}
          >
            <Check className="h-4 w-4 mr-1" />
            Accept
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="connection-action-button"
            onClick={(e) => handleActionTap('decline', e)}
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
          onClick={(e) => handleActionTap('connect', e)}
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
          onClick={(e) => handleActionTap('message', e)}
        >
          <MessageCircle className="h-4 w-4 mr-1" />
          Message
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="connection-action-button flex-1"
          onClick={(e) => handleActionTap('gift', e)}
        >
          <Gift className="h-4 w-4 mr-1" />
          Gift
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
    <div className="relative">
      {/* Swipe Action Backgrounds */}
      {onSwipeLeft && isTracking && (
        <div className="connection-swipe-actions left">
          <MessageCircle className="h-5 w-5" />
        </div>
      )}
      {onSwipeRight && isTracking && (
        <div className="connection-swipe-actions right">
          <Gift className="h-5 w-5" />
        </div>
      )}
      
      {/* Main Card */}
      <div
        ref={swipeRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`connection-card connection-card-swipeable bg-card border border-border rounded-xl p-4 transition-all duration-200 ${
          isTracking ? 'swiping' : ''
        } ${isExpanded ? 'ring-2 ring-primary/20' : ''}`}
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
              {/* Gift Badge for mobile cards */}
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
            {/* Bio */}
            {connection.bio && (
              <p className="text-sm text-muted-foreground">
                {connection.bio}
              </p>
            )}

            {/* Interests */}
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

            {/* Last Active */}
            {connection.lastActive && (
              <p className="text-xs text-muted-foreground">
                Active {connection.lastActive}
              </p>
            )}

            {/* Action Buttons */}
            <div className="pt-2">
              {renderActionButtons()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};