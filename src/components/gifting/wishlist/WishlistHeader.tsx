
import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface WishlistHeaderProps {
  title: string;
  onCreateNew: () => void;
}

const WishlistHeader = ({ onCreateNew }: WishlistHeaderProps) => {
  return (
    <div className="flex justify-end items-center mb-6">
      <Button onClick={onCreateNew}>
        <Plus className="mr-2 h-4 w-4" />
        New Wishlist
      </Button>
    </div>
  );
};

export default WishlistHeader;
