
import React from "react";
import { User } from "lucide-react";
import { CardTitle, CardDescription } from "@/components/ui/card";
import { Wishlist } from "@/types/profile";

interface WishlistOwnerInfoProps {
  wishlist: Wishlist;
  ownerProfile: {
    name?: string;
    image?: string;
  } | null;
}

const WishlistOwnerInfo = ({ wishlist, ownerProfile }: WishlistOwnerInfoProps) => {
  return (
    <div className="flex items-center gap-4">
      {ownerProfile?.image ? (
        <img 
          src={ownerProfile.image} 
          alt={ownerProfile.name || "Wishlist Owner"} 
          className="w-12 h-12 rounded-full object-cover" 
        />
      ) : (
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
          <User className="h-6 w-6 text-primary" />
        </div>
      )}
      <div>
        <CardTitle className="text-xl">{wishlist.title}</CardTitle>
        <CardDescription>
          {ownerProfile?.name}'s wishlist · {wishlist.items.length} items
        </CardDescription>
      </div>
    </div>
  );
};

export default WishlistOwnerInfo;
