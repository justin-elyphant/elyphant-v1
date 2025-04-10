
import React from "react";
import { Gift } from "lucide-react";
import { Customer } from "../mockData";

interface WishlistTabProps {
  customer: Customer;
}

const WishlistTab: React.FC<WishlistTabProps> = ({ customer }) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      {customer.wishlists.map(wishlist => (
        <div key={wishlist.id} className="border rounded-md p-4 hover:bg-gray-50 cursor-pointer">
          <div className="flex justify-between items-center">
            <div>
              <div className="font-medium">{wishlist.name}</div>
              <div className="text-sm text-muted-foreground">{wishlist.itemCount} items</div>
            </div>
            <Gift className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default WishlistTab;
