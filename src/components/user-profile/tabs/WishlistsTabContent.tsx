
import React from "react";
import { Grid, Plus } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface WishlistsTabContentProps {
  isCurrentUser: boolean;
  wishlists: any[];
}

const WishlistsTabContent = ({ isCurrentUser, wishlists }: WishlistsTabContentProps) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Wishlists</h3>
        <div className="flex gap-2">
          {isCurrentUser && (
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" className="flex items-center gap-1">
                  <Plus className="h-4 w-4" /> Create Wishlist
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Wishlist</DialogTitle>
                  <DialogDescription>
                    This feature is coming soon!
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
      
      {wishlists.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {wishlists.map((wishlist) => (
            <Card key={wishlist.id} className="overflow-hidden">
              <div className="h-32 bg-cover bg-center" style={{
                backgroundImage: `url(${wishlist.image})`
              }} />
              <CardHeader className="pb-2">
                <h4 className="font-semibold">{wishlist.title}</h4>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm text-muted-foreground">{wishlist.description}</p>
                <p className="text-sm mt-1">{wishlist.itemCount} items</p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link to={`/wishlist/${wishlist.id}`}>View Wishlist</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 border rounded-lg">
          <Grid className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
          <h4 className="font-medium">No wishlists yet</h4>
          <p className="text-sm text-muted-foreground mt-1">
            {isCurrentUser 
              ? "Create your first wishlist to share with friends." 
              : "This user hasn't created any wishlists yet."}
          </p>
          
          {isCurrentUser && (
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

export default WishlistsTabContent;
