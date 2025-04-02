
import React from "react";
import { cn } from "@/lib/utils";
import { Heart, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GiftItemCardProps {
  name: string;
  price: number;
  brand: string;
  imageUrl: string;
  mini?: boolean;
  className?: string;
}

const GiftItemCard = ({ 
  name, 
  price, 
  brand, 
  imageUrl, 
  mini = false,
  className 
}: GiftItemCardProps) => {
  if (mini) {
    return (
      <div 
        className={cn(
          "group relative border rounded-md overflow-hidden hover:border-primary transition-colors",
          className
        )}
      >
        <div className="aspect-square bg-gray-100">
          <img 
            src={imageUrl} 
            alt={name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-2 text-xs">
          <p className="font-medium line-clamp-1">{name}</p>
          <p className="text-muted-foreground">${price}</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "group relative border rounded-md overflow-hidden hover:shadow-md transition-all",
        className
      )}
    >
      <div className="absolute top-2 right-2 z-10">
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm">
          <Heart className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="aspect-square bg-gray-100">
        <img 
          src={imageUrl} 
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
        />
      </div>
      
      <div className="p-4">
        <p className="text-sm text-muted-foreground">{brand}</p>
        <h3 className="font-medium mb-2 line-clamp-2">{name}</h3>
        <div className="flex justify-between items-center">
          <p className="font-bold">${price}</p>
          <Button size="sm" variant="secondary">
            <ShoppingCart className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GiftItemCard;
