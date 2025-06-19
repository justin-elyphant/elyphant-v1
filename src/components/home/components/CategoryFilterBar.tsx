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
  { name: "All Categories", value: "", searchTerm: "" },
  { name: "Electronics", value: "electronics", searchTerm: "best selling electronics" },
  { name: "Fashion", value: "fashion", searchTerm: "best selling fashion" },
  { name: "Home & Garden", value: "home", searchTerm: "best selling home products" },
  { name: "Sports & Outdoors", value: "sports", searchTerm: "best selling sports equipment" },
  { name: "Beauty & Personal Care", value: "beauty", searchTerm: "best selling beauty products" },
  { name: "Books & Media", value: "books", searchTerm: "best selling books" },
  { name: "Toys & Games", value: "toys", searchTerm: "best selling toys" },
];

const CategoryFilterBar: React.FC<CategoryFilterBarProps> = ({ mobile = false }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const [selectedCategory, setSelectedCategory] = useState("");

  const handleCategorySelect = (categoryValue: string) => {
    setSelectedCategory(categoryValue);
    const category = categories.find(cat => cat.value === categoryValue);
    const params = new URLSearchParams(searchParams);
    
    if (category?.searchTerm) {
      // Use search term for better results
      params.set("search", category.searchTerm);
      if (categoryValue) {
        params.set("category", categoryValue);
      } else {
        params.delete("category");
      }
    } else if (categoryValue) {
      params.set("category", categoryValue);
      params.delete("search");
    } else {
      params.delete("category");
      params.delete("search");
    }
    navigate(`/marketplace?${params.toString()}`);
  };

  const selectedCategoryName = categories.find(cat => cat.value === selectedCategory)?.name || "All Categories";

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 flex-shrink-0">Shop by:</span>
      
      {/* Category Dropdown - more compact and consistent */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 px-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 text-xs font-medium"
          >
            <Grid3X3 className="h-3 w-3 mr-1.5" />
            <span className="max-w-[100px] truncate">
              {selectedCategoryName}
            </span>
            <ChevronDown className="h-3 w-3 ml-1.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48 bg-white border shadow-lg z-50">
          {categories.map((category) => (
            <DropdownMenuItem
              key={category.value}
              onClick={() => handleCategorySelect(category.value)}
              className="cursor-pointer hover:bg-gray-100 text-sm"
            >
              {category.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Quick category buttons for popular categories - more compact */}
      {!mobile && !isMobile && (
        <div className="flex items-center gap-1.5 ml-1">
          {categories.slice(1, 5).map((category) => (
            <Button
              key={category.value}
              variant="ghost"
              size="sm"
              onClick={() => handleCategorySelect(category.value)}
              className={`h-7 px-2 text-xs font-medium ${
                selectedCategory === category.value 
                  ? "bg-blue-50 text-blue-600 hover:bg-blue-100" 
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
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
