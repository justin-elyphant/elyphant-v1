import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Share2, Gift } from "lucide-react";
import GiftItemCard from "./GiftItemCard";

// Mock data for wishlists
const myWishlists = [
  {
    id: 1,
    title: "Birthday Wishlist",
    description: "Things I'd love to receive for my birthday",
    items: [
      { id: 1, name: "Wireless Headphones", price: 199, brand: "Bose", imageUrl: "/placeholder.svg" },
      { id: 2, name: "Smart Watch", price: 349, brand: "Apple", imageUrl: "/placeholder.svg" },
      { id: 3, name: "Fitness Tracker", price: 129, brand: "Fitbit", imageUrl: "/placeholder.svg" },
    ]
  },
  {
    id: 2,
    title: "Holiday Wishlist",
    description: "Gift ideas for the holidays",
    items: [
      { id: 4, name: "Leather Wallet", price: 89, brand: "Coach", imageUrl: "/placeholder.svg" },
      { id: 5, name: "Portable Speaker", price: 129, brand: "JBL", imageUrl: "/placeholder.svg" },
    ]
  }
];

const MyWishlists = () => {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">My Wishlists</h2>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Wishlist
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Create a new wishlist card */}
        <Card className="border-dashed border-2 border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors">
          <CardContent className="flex flex-col items-center justify-center h-64 p-6">
            <Plus className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-600">Create New Wishlist</p>
            <p className="text-sm text-gray-500 text-center mt-2">
              Add items you'd like to receive as gifts
            </p>
            <Button variant="ghost" className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Get Started
            </Button>
          </CardContent>
        </Card>
        
        {/* Existing wishlists */}
        {myWishlists.map((wishlist) => (
          <Card key={wishlist.id}>
            <CardHeader>
              <CardTitle>{wishlist.title}</CardTitle>
              <CardDescription>{wishlist.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {wishlist.items.slice(0, 4).map((item) => (
                  <GiftItemCard 
                    key={item.id}
                    name={item.name}
                    price={item.price}
                    brand={item.brand}
                    imageUrl={item.imageUrl}
                    mini
                  />
                ))}
              </div>
              {wishlist.items.length > 4 && (
                <p className="text-sm text-gray-500 mt-2">
                  +{wishlist.items.length - 4} more items
                </p>
              )}
            </CardContent>
            <CardFooter className="justify-between">
              <Button variant="outline" size="sm">
                <Edit className="mr-2 h-3 w-3" />
                Edit
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="mr-2 h-3 w-3" />
                Share
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MyWishlists;
