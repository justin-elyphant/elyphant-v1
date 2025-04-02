
import React from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const WishlistsCard = () => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center">
          <Heart className="h-5 w-5 mr-2 text-pink-500" />
          My Wishlists
        </CardTitle>
        <CardDescription>
          Keep track of things you want
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground mb-4">
            Create and manage your wishlists to share with friends and family.
          </p>
          <Button className="w-full" asChild>
            <Link to="/wishlists">View My Wishlists</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default WishlistsCard;
