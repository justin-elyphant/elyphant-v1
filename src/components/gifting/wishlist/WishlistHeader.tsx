
import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface WishlistHeaderProps {
  title: string;
  onCreateNew: () => void;
}

const WishlistHeader = ({ title, onCreateNew }: WishlistHeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-2xl font-bold">{title}</h2>
      <Button onClick={onCreateNew}>
        <Plus className="mr-2 h-4 w-4" />
        New Wishlist
      </Button>
    </div>
  );
};

export default WishlistHeader;
