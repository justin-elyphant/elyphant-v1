
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { CategoryImportance, getSuggestedCategories } from "./utils";

export interface CategorySectionProps {
  preferences: Array<{ category: string; importance: CategoryImportance }>;
  onChange: (preferences: Array<{ category: string; importance: CategoryImportance }>) => void;
  selectedCategories?: string[];
  onCategorySelect?: (category: string) => void;
  searchTerm?: string;
  onSearchChange?: React.Dispatch<React.SetStateAction<string>>;
  suggestedCategories?: string[];
}

const CategorySection: React.FC<CategorySectionProps> = ({
  preferences,
  onChange,
  selectedCategories = [],
  onCategorySelect,
  searchTerm = "",
  onSearchChange,
  suggestedCategories = []
}) => {
  const [localSearchTerm, setLocalSearchTerm] = useState("");
  const [localSuggestions, setLocalSuggestions] = useState(getSuggestedCategories(""));
  
  // Use either passed in values or local state
  const currentSearchTerm = onSearchChange ? searchTerm : localSearchTerm;
  const currentSuggestions = onCategorySelect ? suggestedCategories : localSuggestions;
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (onSearchChange) {
      onSearchChange(value);
    } else {
      setLocalSearchTerm(value);
      setLocalSuggestions(getSuggestedCategories(value));
    }
  };
  
  const handleCategorySelect = (category: string) => {
    if (onCategorySelect) {
      onCategorySelect(category);
    } else {
      // If no external handler, manage internally
      if (!preferences.some(p => p.category === category)) {
        onChange([...preferences, { category, importance: "medium" }]);
      }
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Input
          placeholder="Search for categories..."
          value={currentSearchTerm}
          onChange={handleSearchChange}
          className="w-full"
        />
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {currentSuggestions.map((category) => {
          const isSelected = (selectedCategories || []).includes(category) || 
                           preferences.some(p => p.category === category);
          return (
            <button
              key={category}
              type="button"
              onClick={() => handleCategorySelect(category)}
              disabled={isSelected}
              className={`text-sm py-1.5 px-2.5 rounded-md ${
                isSelected
                  ? "bg-primary/10 text-primary border border-primary/30"
                  : "hover:bg-muted border border-border"
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategorySection;
