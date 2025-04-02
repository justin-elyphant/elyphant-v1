
import React from "react";
import { Link } from "react-router-dom";
import { UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const FriendsCard = () => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center">
          <UserRound className="h-5 w-5 mr-2 text-orange-500" />
          Friends & Following
        </CardTitle>
        <CardDescription>
          Connect with others
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground mb-4">
            Discover friends' wishlists and follow people with similar interests.
          </p>
          <Button className="w-full" asChild>
            <Link to="/connections">Manage Connections</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FriendsCard;
