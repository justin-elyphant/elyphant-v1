
import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useDirectFollow } from "@/hooks/useDirectFollow";
import { UserPlus, UserMinus, UserX, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface FollowButtonProps {
  targetUserId: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
  className?: string;
}

const FollowButton: React.FC<FollowButtonProps> = ({
  targetUserId,
  variant = "default",
  size = "default",
  className
}) => {
  const {
    followState,
    loading,
    checkFollowStatus,
    followUser,
    unfollowUser
  } = useDirectFollow(targetUserId);

  useEffect(() => {
    checkFollowStatus();
  }, [checkFollowStatus]);

  const handleClick = () => {
    if (followState.isFollowing) {
      unfollowUser();
    } else {
      followUser();
    }
  };

  // Don't render if blocked or can't follow
  if (followState.isBlocked || !followState.canFollow) {
    return null;
  }

  const getButtonContent = () => {
    if (loading) {
      return (
        <>
          <Clock className="h-4 w-4 mr-2 animate-spin" />
          Loading...
        </>
      );
    }

    if (followState.isFollowing) {
      return (
        <>
          <UserMinus className="h-4 w-4 mr-2" />
          Following
        </>
      );
    }

    if (followState.requiresRequest) {
      return (
        <>
          <UserPlus className="h-4 w-4 mr-2" />
          Request to Follow
        </>
      );
    }

    return (
      <>
        <UserPlus className="h-4 w-4 mr-2" />
        Follow
      </>
    );
  };

  const getButtonVariant = () => {
    if (followState.isFollowing) {
      return "outline";
    }
    return variant;
  };

  return (
    <Button
      onClick={handleClick}
      disabled={loading}
      variant={getButtonVariant()}
      size={size}
      className={cn(
        followState.isFollowing && "hover:bg-destructive hover:text-destructive-foreground",
        className
      )}
    >
      {getButtonContent()}
    </Button>
  );
};

export default FollowButton;
