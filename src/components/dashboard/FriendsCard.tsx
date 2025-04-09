
import React from "react";
import { Link } from "react-router-dom";
import { Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const FriendsCard = () => {
  // Mock friends data - in a real app, this would come from an API
  const friends = [
    { id: '123e4567-e89b-12d3-a456-426614174000', name: 'Alex Johnson', image: null },
    { id: '223e4567-e89b-12d3-a456-426614174001', name: 'Jamie Smith', image: null },
    { id: '323e4567-e89b-12d3-a456-426614174002', name: 'Taylor Wilson', image: null },
  ];

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center">
          <Users className="h-5 w-5 mr-2 text-gray-500" />
          Friends
        </CardTitle>
        <CardDescription>
          Connect with friends to share wishlists
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {friends.length > 0 ? (
            <div className="space-y-3">
              {friends.map((friend) => (
                <div key={friend.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={friend.image || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {friend.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{friend.name}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/user/${friend.id}`}>View</Link>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <p>No friends yet</p>
            </div>
          )}
          
          <Button className="w-full" asChild>
            <Link to="/connections">Find Friends</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FriendsCard;
