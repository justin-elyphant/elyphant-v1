
import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Grid3X3, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";

interface CategoryFilterBarProps {
  mobile?: boolean;
}

const categories = [
  { name: "All Categories", value: "" },
  { name: "Electronics", value: "electronics" },
  { name: "Fashion", value: "fashion" },
  { name: "Home & Garden", value: "home" },
  { name: "Sports & Outdoors", value: "sports" },
  { name: "Beauty & Personal Care", value: "beauty" },
  { name: "Books & Media", value: "books" },
  { name: "Toys & Games", value: "toys" },
];

const CategoryFilterBar: React.FC<CategoryFilterBarProps> = ({ mobile = false }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const [selectedCategory, setSelectedCategory] = useState("");

  const handleCategorySelect = (categoryValue: string) => {
    setSelectedCategory(categoryValue);
    const params = new URLSearchParams(searchParams);
    if (categoryValue) {
      params.set("category", categoryValue);
    } else {
      params.delete("category");
    }
    navigate(`/marketplace?${params.toString()}`);
  };

  const selectedCategoryName = categories.find(cat => cat.value === selectedCategory)?.name || "All Categories";

  return (
    <div className="flex items-center gap-3 py-2">
      <span className="text-sm text-gray-600 flex-shrink-0">Shop by:</span>
      
      {/* Category Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-9 px-3 text-gray-700 hover:text-gray-900 border-gray-300"
          >
            <Grid3X3 className="h-4 w-4 mr-2" />
            <span className="text-sm">
              {selectedCategoryName}
            </span>
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48 bg-white border shadow-lg z-50">
          {categories.map((category) => (
            <DropdownMenuItem
              key={category.value}
              onClick={() => handleCategorySelect(category.value)}
              className="cursor-pointer hover:bg-gray-100"
            >
              {category.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Quick category buttons for popular categories */}
      {!mobile && (
        <div className="flex items-center gap-2 ml-4">
          {categories.slice(1, 5).map((category) => (
            <Button
              key={category.value}
              variant="ghost"
              size="sm"
              onClick={() => handleCategorySelect(category.value)}
              className={`h-8 px-3 text-xs ${
                selectedCategory === category.value 
                  ? "bg-blue-50 text-blue-600" 
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {category.name}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryFilterBar;
