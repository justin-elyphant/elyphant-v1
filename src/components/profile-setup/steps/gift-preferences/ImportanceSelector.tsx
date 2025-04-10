
import React from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface ImportanceSelectorProps {
  value: "high" | "medium" | "low";
  onChange: (value: "high" | "medium" | "low") => void;
}

const ImportanceSelector: React.FC<ImportanceSelectorProps> = ({ value, onChange }) => {
  return (
    <div>
      <Label className="text-sm">Importance Level</Label>
      <RadioGroup 
        value={value} 
        onValueChange={(val) => onChange(val as "high" | "medium" | "low")}
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
