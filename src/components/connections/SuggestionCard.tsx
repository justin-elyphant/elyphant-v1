
import React, { useState } from "react";
import { UserPlus, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Connection } from "@/types/connections";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SuggestionCardProps {
  suggestion: Connection;
  onConnect?: (suggestionId: string) => void;
  onDismiss?: (suggestionId: string) => void;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({ 
  suggestion, 
  onConnect,
  onDismiss 
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) {
        toast.error('Please log in to connect with users');
        return;
      }

      // Create a connection request
      const { error } = await supabase
        .from('user_connections')
        .insert({
          user_id: currentUser.user.id,
          connected_user_id: suggestion.id,
          status: 'pending',
          relationship_type: 'friend'
        });

      if (error) throw error;

      toast.success(`Connection request sent to ${suggestion.name}`);
      onConnect?.(suggestion.id);
    } catch (error) {
      console.error('Error sending connection request:', error);
      toast.error('Failed to send connection request');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.(suggestion.id);
    toast.info(`${suggestion.name} dismissed from suggestions`);
  };

  if (isDismissed) {
    return null;
  }

  return (
    <Card key={suggestion.id}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={suggestion.imageUrl} alt={suggestion.name} />
              <AvatarFallback>{suggestion.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{suggestion.name}</CardTitle>
              <CardDescription>{suggestion.username}</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium">{suggestion.mutualFriends}</span> mutual connections
        </p>
        <p className="text-xs text-muted-foreground">
          {suggestion.reason}
        </p>
        {suggestion.bio && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {suggestion.bio}
          </p>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          size="sm" 
          onClick={handleConnect}
          disabled={isConnecting}
        >
          <UserPlus className="h-3 w-3 mr-2" />
          {isConnecting ? 'Connecting...' : 'Connect'}
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={handleDismiss}
        >
          <X className="h-3 w-3 mr-1" />
          Dismiss
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SuggestionCard;
