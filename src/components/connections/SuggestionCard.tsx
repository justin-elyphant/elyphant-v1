
import React from "react";
import { UserPlus } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Connection } from "@/types/connections";

interface SuggestionCardProps {
  suggestion: Connection;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({ suggestion }) => {
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
        <p className="text-xs">
          {suggestion.reason}
        </p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button size="sm">
          <UserPlus className="h-3 w-3 mr-2" />
          Connect
        </Button>
        <Button variant="ghost" size="sm">
          Dismiss
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SuggestionCard;
