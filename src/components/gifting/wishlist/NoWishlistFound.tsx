
import React from "react";
import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const NoWishlistFound = () => {
  return (
    <Card className="text-center py-12">
      <CardContent className="space-y-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
          <Lock className="h-6 w-6 text-gray-500" />
        </div>
        <h2 className="text-xl font-bold">This wishlist is private</h2>
        <p className="text-muted-foreground">
          This wishlist is either private or has been removed.
        </p>
        <Button asChild className="mt-4">
          <Link to="/">Go Home</Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default NoWishlistFound;
