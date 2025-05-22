
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Gift } from "lucide-react";

interface Wishlist {
  id: string;
  title: string;
}

interface FriendWishlistSelectorProps {
  wishlists: Wishlist[];
  selectedWishlistId: string | "all";
  onSelect: (wishlistId: string | "all") => void;
}

const FriendWishlistSelector: React.FC<FriendWishlistSelectorProps> = ({
  wishlists,
  selectedWishlistId,
  onSelect
}) => {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-1 flex items-center gap-2">
        <Gift className="w-4 h-4 text-purple-600" />
        Select Gift List
      </label>
      <Select value={selectedWishlistId} onValueChange={onSelect}>
        <SelectTrigger className="w-full bg-white">
          <SelectValue placeholder="Select a list..." />
        </SelectTrigger>
        <SelectContent className="z-50 bg-white">
          <SelectItem value="all">
            All Wishlists
          </SelectItem>
          {wishlists.map(list => (
            <SelectItem key={list.id} value={list.id}>
              {list.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default FriendWishlistSelector;
