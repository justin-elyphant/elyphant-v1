
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gift, Users, Calendar, CreditCard, Heart } from "lucide-react";
import GiftItemCard from "./GiftItemCard";

// Mock data for friends and their wishlists
const friends = [
  {
    id: 1,
    name: "Alex Johnson",
    avatarUrl: "/placeholder.svg",
    upcoming: "Birthday in 2 weeks",
    wishlists: [
      {
        id: 1,
        title: "Birthday Wishlist",
        items: [
          { id: 1, name: "Nike Air Max", price: 129, brand: "Nike", imageUrl: "/placeholder.svg" },
          { id: 2, name: "PlayStation Game", price: 59, brand: "Sony", imageUrl: "/placeholder.svg" },
        ]
      }
    ]
  },
  {
    id: 2,
    name: "Jamie Smith",
    avatarUrl: "/placeholder.svg",
    upcoming: "Anniversary in 1 month",
    wishlists: [
      {
        id: 2,
        title: "Anniversary Ideas",
        items: [
          { id: 3, name: "Silver Bracelet", price: 89, brand: "Tiffany", imageUrl: "/placeholder.svg" },
          { id: 4, name: "Perfume Set", price: 120, brand: "Chanel", imageUrl: "/placeholder.svg" },
        ]
      }
    ]
  },
  {
    id: 3,
    name: "Taylor Wilson",
    avatarUrl: "/placeholder.svg",
    upcoming: "Holiday in 3 months",
    wishlists: [
      {
        id: 3,
        title: "Holiday Wishlist",
        items: [
          { id: 5, name: "Bluetooth Speaker", price: 79, brand: "JBL", imageUrl: "/placeholder.svg" },
          { id: 6, name: "Coffee Maker", price: 149, brand: "Keurig", imageUrl: "/placeholder.svg" },
        ]
      }
    ]
  }
];

const FriendsWishlists = () => {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Friends' Wishlists</h2>
        <Button variant="outline">
          <Users className="mr-2 h-4 w-4" />
          Find Friends
        </Button>
      </div>
      
      <Tabs defaultValue="all" className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Friends</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
        </TabsList>
      </Tabs>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {friends.map((friend) => (
          <Card key={friend.id}>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={friend.avatarUrl} alt={friend.name} />
                  <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg">{friend.name}</CardTitle>
                  <CardDescription className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {friend.upcoming}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {friend.wishlists.map((wishlist) => (
                <div key={wishlist.id} className="mb-4">
                  <h4 className="font-medium text-sm mb-2">{wishlist.title}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {wishlist.items.map((item) => (
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
                </div>
              ))}
            </CardContent>
            <CardFooter className="justify-between">
              <Button variant="outline" size="sm">
                <Gift className="mr-2 h-3 w-3" />
                Send Gift
              </Button>
              <Button variant="outline" size="sm">
                <CreditCard className="mr-2 h-3 w-3" />
                Auto-Gift
              </Button>
              <Button variant="ghost" size="sm">
                <Heart className="h-3 w-3" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FriendsWishlists;
