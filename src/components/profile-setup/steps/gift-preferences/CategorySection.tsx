
import React from "react";
import { RadioGroup } from "@/components/ui/radio-group";
import ImportanceSelector from "./ImportanceSelector";

interface CategorySectionProps {
  selectedValue: "low" | "medium" | "high";
  onSelectionChange: (value: "low" | "medium" | "high") => void;
}

const CategorySection: React.FC<CategorySectionProps> = ({ 
  selectedValue, 
  onSelectionChange 
}) => {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Importance:</p>
      <RadioGroup className="flex space-x-2">
        <ImportanceSelector
          level="low"
          label="Low"
          description="Nice to have"
          isSelected={selectedValue === "low"}
          onSelect={() => onSelectionChange("low")}
        />
        <ImportanceSelector
          level="medium"
          label="Medium"
          description="Would like"
          isSelected={selectedValue === "medium"}
          onSelect={() => onSelectionChange("medium")}
        />
        <ImportanceSelector
          level="high"
          label="High"
          description="Really want"
          isSelected={selectedValue === "high"}
          onSelect={() => onSelectionChange("high")}
        />
      </RadioGroup>
    </div>
  );
};

export default CategorySection;
