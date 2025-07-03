
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Connection } from "@/types/connections";
import { UserPlus, UserMinus, MessageCircle, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MobileConnectionCardProps {
  connection: Connection;
  onConnect?: () => void;
  onMessage?: () => void;
  onRemove?: () => void;
  className?: string;
}

const MobileConnectionCard: React.FC<MobileConnectionCardProps> = ({
  connection,
  onConnect,
  onMessage,
  onRemove,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCardTap = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <Card 
      className={cn(
        "touch-manipulation transition-all duration-200 hover:shadow-md",
        isExpanded && "shadow-lg",
        className
      )}
      onClick={handleCardTap}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <Avatar className="h-12 w-12 flex-shrink-0">
              <AvatarImage src={connection.imageUrl} alt={connection.name} />
              <AvatarFallback className="text-sm">
                {connection.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-base truncate">
                {connection.name}
              </h3>
              <p className="text-sm text-muted-foreground truncate">
                {connection.username}
              </p>
              {connection.mutualFriends > 0 && (
                <p className="text-xs text-muted-foreground">
                  {connection.mutualFriends} mutual
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0">
            {connection.type === 'friend' && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onMessage?.();
                }}
                className="h-8 w-8 p-0"
              >
                <MessageCircle className="h-4 w-4" />
              </Button>
            )}
            
            {connection.type === 'suggestion' && (
              <Button
                variant="default"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onConnect?.();
                }}
                className="h-8 px-3"
              >
                <UserPlus className="h-4 w-4 mr-1" />
                Add
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>View Profile</DropdownMenuItem>
                {connection.type === 'friend' && (
                  <DropdownMenuItem 
                    onClick={onRemove}
                    className="text-destructive"
                  >
                    Remove Connection
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
            {connection.bio && (
              <p className="text-sm text-muted-foreground">
                {connection.bio}
              </p>
            )}
            
            {connection.interests && connection.interests.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {connection.interests.slice(0, 3).map(interest => (
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

            {connection.reason && (
              <p className="text-xs text-muted-foreground italic">
                {connection.reason}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MobileConnectionCard;
