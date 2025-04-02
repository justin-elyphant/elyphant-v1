
import React from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Share2, ShoppingBag } from "lucide-react";
import GiftItemCard from "../GiftItemCard";

export interface WishlistItem {
  id: number;
  name: string;
  price: number;
  brand: string;
  imageUrl: string;
}

export interface WishlistData {
  id: number;
  title: string;
  description: string;
  items: WishlistItem[];
}

interface WishlistCardProps {
  wishlist: WishlistData;
  onEdit: (id: number) => void;
  onShare: (id: number) => void;
}

const WishlistCard = ({ wishlist, onEdit, onShare }: WishlistCardProps) => {
  return (
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
        
        {wishlist.items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8">
            <p className="text-muted-foreground text-center mb-4">
              This wishlist is empty. Start adding items!
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link to="/marketplace">
                <ShoppingBag className="mr-2 h-4 w-4" />
                Start Shopping
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
      <CardFooter className={wishlist.items.length > 0 ? "justify-between" : "justify-between flex-wrap gap-2"}>
        <Button variant="outline" size="sm" onClick={() => onEdit(wishlist.id)}>
          <Edit className="mr-2 h-3 w-3" />
          Edit
        </Button>
        <Button variant="outline" size="sm" onClick={() => onShare(wishlist.id)}>
          <Share2 className="mr-2 h-3 w-3" />
          Share
        </Button>
        {wishlist.items.length > 0 && (
          <Button asChild variant="outline" size="sm" className="mt-2 w-full">
            <Link to="/marketplace">
              <ShoppingBag className="mr-2 h-3 w-3" />
              Add More Items
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default WishlistCard;
