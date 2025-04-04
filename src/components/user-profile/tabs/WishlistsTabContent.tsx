
import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bookmark } from "lucide-react";

interface WishlistsTabContentProps {
  isCurrentUser: boolean;
  wishlists: any[];
}

const WishlistsTabContent = ({ isCurrentUser, wishlists }: WishlistsTabContentProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {wishlists.map(wishlist => (
        <Card key={wishlist.id} className="overflow-hidden">
          <div 
            className="h-36 bg-cover bg-center"
            style={{ backgroundImage: `url(${wishlist.image})` }}
          />
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{wishlist.title}</CardTitle>
            <CardDescription>{wishlist.description}</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{wishlist.itemCount} items</span>
              <Button variant="ghost" size="sm">
                <Bookmark className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {isCurrentUser && (
        <Card className="flex items-center justify-center h-full border-dashed">
          <CardContent className="py-8">
            <Button variant="outline" asChild>
              <Link to="/wishlists/create">
                Create New Wishlist
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WishlistsTabContent;
