
import React from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface ImportanceSelectorProps {
  category: string;
  importance: 'low' | 'medium' | 'high';
  onImportanceChange: (category: string, importance: 'low' | 'medium' | 'high') => void;
  categoryName: string;
}

const ImportanceSelector: React.FC<ImportanceSelectorProps> = ({
  category,
  importance,
  onImportanceChange,
  categoryName
}) => {
  return (
    <div className="flex items-center justify-between bg-background p-3 rounded-md border">
      <div>
        <p className="font-medium">{categoryName}</p>
      </div>
      
      <RadioGroup
        value={importance}
        onValueChange={(value) => onImportanceChange(category, value as 'low' | 'medium' | 'high')}
        className="flex items-center space-x-4"
      >
        <div className="flex items-center space-x-1">
          <RadioGroupItem value="low" id={`${category}-low`} />
          <Label htmlFor={`${category}-low`} className="text-sm">Low</Label>
        </div>
        
        <div className="flex items-center space-x-1">
          <RadioGroupItem value="medium" id={`${category}-medium`} />
          <Label htmlFor={`${category}-medium`} className="text-sm">Medium</Label>
        </div>
        
        <div className="flex items-center space-x-1">
          <RadioGroupItem value="high" id={`${category}-high`} />
          <Label htmlFor={`${category}-high`} className="text-sm">High</Label>
        </div>
      </RadioGroup>
    </div>
  );
};

export default ImportanceSelector;
