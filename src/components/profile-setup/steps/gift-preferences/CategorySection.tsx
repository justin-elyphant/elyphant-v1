
import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface CategorySectionProps {
  title: string;
  description?: string;
  categories: string[] | { name: string; emoji?: string }[];
  onSelect: (category: string, importance?: "high" | "medium" | "low") => void;
  importance?: "high" | "medium" | "low";
  renderPrefix?: (category: string | { name: string; emoji?: string }) => React.ReactNode;
}

const CategorySection: React.FC<CategorySectionProps> = ({
  title,
  description,
  categories,
  onSelect,
  importance = "medium",
  renderPrefix
}) => {
  return (
    <div className="mt-4">
      <Label className="text-sm mb-2 block">{title}</Label>
      {description && (
        <p className="text-xs text-muted-foreground mb-2">
          {description}
        </p>
      )}
      <div className="flex flex-wrap gap-2 mb-4">
        {categories.map((category, index) => {
          const categoryName = typeof category === 'string' ? category : category.name;
          return (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => onSelect(categoryName, importance)}
              className="rounded-full text-xs"
            >
              {renderPrefix && renderPrefix(category)}
              {categoryName}
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default CategorySection;
