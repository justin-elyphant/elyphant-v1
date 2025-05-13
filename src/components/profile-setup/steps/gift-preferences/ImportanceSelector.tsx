
import React from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface ImportanceSelectorProps {
  level?: "high" | "medium" | "low";
  value?: "high" | "medium" | "low";
  onChange?: (value: "high" | "medium" | "low") => void;
  label?: string;
  description?: string;
  isSelected?: boolean;
  onSelect?: () => void;
}

const ImportanceSelector: React.FC<ImportanceSelectorProps> = ({
  level,
  value,
  onChange,
  label,
  description,
  isSelected,
  onSelect
}) => {
  // Support both the old and new prop patterns
  if (level && isSelected !== undefined && onSelect) {
    // Original usage pattern from CategorySection
    return (
      <div
        className={`border rounded-md p-3 ${
          isSelected ? "border-primary bg-primary/5" : "border-gray-200"
        }`}
        onClick={onSelect}
      >
        <Label className="font-medium cursor-pointer">{label}</Label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    );
  }
  
  // New usage pattern (for future compatibility)
  return (
    <div>
      <Label className="text-sm">Importance Level</Label>
      <RadioGroup 
        value={value} 
        onValueChange={(val) => onChange?.(val as "high" | "medium" | "low")}
        className="flex space-x-2 mt-2"
      >
        <div className="flex items-center space-x-1">
          <RadioGroupItem value="low" id="low" />
          <Label htmlFor="low" className="text-sm font-normal">Low</Label>
        </div>
        <div className="flex items-center space-x-1">
          <RadioGroupItem value="medium" id="medium" />
          <Label htmlFor="medium" className="text-sm font-normal">Medium</Label>
        </div>
        <div className="flex items-center space-x-1">
          <RadioGroupItem value="high" id="high" />
          <Label htmlFor="high" className="text-sm font-normal">High</Label>
        </div>
      </RadioGroup>
    </div>
  );
};

export default ImportanceSelector;
