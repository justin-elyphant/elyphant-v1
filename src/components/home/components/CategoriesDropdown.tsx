
import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const categories = [
  { name: "Accessories", url: "accessories" },
  { name: "Art & Collectibles", url: "art-collectibles" },
  { name: "Baby", url: "baby" },
  { name: "Bags & Purses", url: "bags-purses" },
  { name: "Bath & Beauty", url: "bath-beauty" },
  { name: "Books, Movies & Music", url: "books-movies-music" },
  { name: "Clothing", url: "clothing" },
  { name: "Craft Supplies & Tools", url: "craft-supplies" },
  { name: "Electronics & Accessories", url: "electronics" },
  { name: "Experiences", url: "experiences" },
  { name: "Gifts", url: "gifts" },
  { name: "Home & Living", url: "home-living" },
  { name: "Jewelry", url: "jewelry" },
  { name: "Toys & Games", url: "toys-games" },
  { name: "Wedding & Party", url: "wedding-party" }
];

interface CategoriesDropdownProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CategoriesDropdown: React.FC<CategoriesDropdownProps> = ({ 
  open, 
  onOpenChange 
}) => {
  const navigate = useNavigate();

  const handleCategorySelect = (category: string) => {
    // Navigate to marketplace with category parameter
    navigate(`/marketplace?category=${category}`);
    onOpenChange(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-1">
          Categories <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-56 bg-white p-0 max-h-[70vh] overflow-y-auto z-50" 
        align="start"
      >
        {categories.map((category, index) => (
          <DropdownMenuItem 
            key={index} 
            className="px-4 py-2 hover:bg-accent cursor-pointer"
            onClick={() => handleCategorySelect(category.url)}
          >
            {category.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CategoriesDropdown;
