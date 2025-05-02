
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Grid, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const WishlistsPage = () => {
  // This could be fetched from a context or API in the future
  const mockWishlists = [
    {
      id: "1",
      title: "Birthday Wishlist",
      description: "Things I'd love for my birthday",
      itemCount: 5,
      image: "https://images.unsplash.com/photo-1577998474517-7eeeed4e448a?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
    },
    {
      id: "2",
      title: "Holiday Gifts",
      description: "My holiday gift ideas",
      itemCount: 8,
      image: "https://images.unsplash.com/photo-1512909006721-3d6018887383?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
    }
  ];
  
  const isCurrentUser = true; // In a real app, this would be determined by auth

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Wishlists</h1>
        <Button asChild>
          <Link to="/create-wishlist">
            <Plus className="h-4 w-4 mr-2" />
            Create Wishlist
          </Link>
        </Button>
      </div>
      
      {mockWishlists.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockWishlists.map((wishlist) => (
            <Card key={wishlist.id} className="overflow-hidden">
              <div className="h-32 bg-cover bg-center" style={{
                backgroundImage: `url(${wishlist.image})`
              }} />
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg">{wishlist.title}</h3>
                <p className="text-sm text-muted-foreground">{wishlist.description}</p>
                <p className="text-sm mt-1">{wishlist.itemCount} items</p>
                
                <div className="mt-4">
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <Link to={`/wishlist/${wishlist.id}`}>View Wishlist</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border rounded-lg">
          <Grid className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
          <h2 className="font-medium text-lg">No wishlists yet</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Create your first wishlist to save items you love.
          </p>
          <Button className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Create Wishlist
          </Button>
        </div>
      )}
    </div>
  );
};

export default WishlistsPage;
