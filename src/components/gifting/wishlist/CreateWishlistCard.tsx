
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface CreateWishlistCardProps {
  onCreateNew: () => void;
}

const CreateWishlistCard = ({ onCreateNew }: CreateWishlistCardProps) => {
  return (
    <Card className="border-dashed border-2 border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors">
      <CardContent className="flex flex-col items-center justify-center h-64 p-6">
        <Plus className="h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-600">Create New Wishlist</p>
        <p className="text-sm text-gray-500 text-center mt-2">
          Add items you'd like to receive as gifts
        </p>
        <Button variant="ghost" className="mt-4" onClick={onCreateNew}>
          <Plus className="mr-2 h-4 w-4" />
          Get Started
        </Button>
      </CardContent>
    </Card>
  );
};

export default CreateWishlistCard;
