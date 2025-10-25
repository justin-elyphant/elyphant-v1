import React, { useState } from "react";
import { Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Product } from "@/contexts/ProductContext";

interface QuickAddButtonProps {
  product: Product;
  onAdd: () => void;
  isAdding: boolean;
}

const QuickAddButton = ({ product, onAdd, isAdding }: QuickAddButtonProps) => {
  const [isAdded, setIsAdded] = useState(false);

  const handleClick = () => {
    onAdd();
    setIsAdded(true);
    
    // Reset after 2 seconds
    setTimeout(() => {
      setIsAdded(false);
    }, 2000);
  };

  if (isAdded) {
    return (
      <Button size="sm" variant="outline" disabled className="gap-1">
        <Check className="h-3 w-3" />
        Added
      </Button>
    );
  }

  return (
    <Button 
      size="sm" 
      onClick={handleClick}
      disabled={isAdding}
      className="gap-1"
    >
      <Plus className="h-3 w-3" />
      Add
    </Button>
  );
};

export default QuickAddButton;
