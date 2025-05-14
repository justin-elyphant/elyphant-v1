
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Profile } from "@/types/profile";
import { Grid, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface WishlistTabContentProps {
  profile: Profile | null;
  isOwnProfile: boolean;
}

const WishlistTabContent: React.FC<WishlistTabContentProps> = ({ profile, isOwnProfile }) => {
  // For now, we'll assume no wishlists are available
  const wishlists = profile?.wishlists || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Wishlists</h3>
        {isOwnProfile && (
          <Button size="sm" asChild>
            <Link to="/create-wishlist">
              <Plus className="h-4 w-4 mr-2" />
              Create Wishlist
            </Link>
          </Button>
        )}
      </div>

      {wishlists.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {wishlists.map((wishlist) => (
            <Card key={wishlist.id}>
              <CardHeader>
                <CardTitle>{wishlist.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{wishlist.description}</p>
                <div className="mt-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/wishlist/${wishlist.id}`}>View Wishlist</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 border rounded-lg">
          <Grid className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
          <h4 className="font-medium">No wishlists yet</h4>
          <p className="text-sm text-muted-foreground mt-1">
            {isOwnProfile 
              ? "Create your first wishlist to share with friends." 
              : "This user hasn't created any wishlists yet."}
          </p>
          
          {isOwnProfile && (
            <Button className="mt-4" asChild>
              <Link to="/create-wishlist">
                <Plus className="h-4 w-4 mr-2" />
                Create Wishlist
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default WishlistTabContent;
