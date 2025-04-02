
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, List } from "lucide-react";

interface CreateWishlistCardProps {
  onCreateNew: () => void;
}

const CreateWishlistCard = ({ onCreateNew }: CreateWishlistCardProps) => {
  return (
    <Card className="border-dashed border-2 border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer" onClick={onCreateNew}>
      <CardContent className="flex flex-col items-center justify-center h-64 p-6">
        <div className="bg-primary/10 p-3 rounded-full mb-4">
          <List className="h-8 w-8 text-primary" />
        </div>
        <p className="text-lg font-medium text-gray-700">Create New Wishlist</p>
        <p className="text-sm text-gray-500 text-center mt-2 mb-4">
          Add items you'd like to receive as gifts
        </p>
        <Button className="mt-auto">
          <Plus className="mr-2 h-4 w-4" />
          Get Started
        </Button>
      </CardContent>
    </Card>
  );
};

export default CreateWishlistCard;
