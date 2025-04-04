
import React from "react";
import { Link } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Connection } from "@/types/connections";

interface FollowingCardProps {
  connection: Connection;
}

const FollowingCard: React.FC<FollowingCardProps> = ({ connection }) => {
  return (
    <Card key={connection.id} className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={connection.imageUrl} alt={connection.name} />
              <AvatarFallback>{connection.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{connection.name}</CardTitle>
              <CardDescription>{connection.username}</CardDescription>
            </div>
          </div>
          <Badge variant="secondary">Following</Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-0">
        {connection.bio && (
          <p className="text-sm mb-3">{connection.bio}</p>
        )}
        
        {connection.interests && connection.interests.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {connection.interests.map(interest => (
              <Badge key={interest} variant="secondary" className="text-xs">{interest}</Badge>
            ))}
          </div>
        )}
        
        <p className="text-sm text-muted-foreground mb-1">
          <span className="font-medium">{connection.mutualFriends}</span> mutual connections
        </p>
        <p className="text-xs text-muted-foreground">Active {connection.lastActive}</p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm" asChild>
          <Link to={`/profile/${connection.id}`}>View Profile</Link>
        </Button>
        <Button variant="outline" size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          Connect
        </Button>
      </CardFooter>
    </Card>
  );
};

export default FollowingCard;
