
import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface CategorySectionProps {
  categories: Array<{ id: string; name: string }>;
  selectedCategories: string[];
  onToggleCategory: (category: string, isSelected: boolean) => void;
}

const CategorySection: React.FC<CategorySectionProps> = ({
  categories,
  selectedCategories,
  onToggleCategory
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Categories</h3>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {categories.map((category) => (
          <div key={category.id} className="flex items-start space-x-2">
            <Checkbox 
              id={`category-${category.id}`}
              checked={selectedCategories.includes(category.id)}
              onCheckedChange={(checked) => onToggleCategory(category.id, checked as boolean)} 
            />
            <Label 
              htmlFor={`category-${category.id}`}
              className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {category.name}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategorySection;
