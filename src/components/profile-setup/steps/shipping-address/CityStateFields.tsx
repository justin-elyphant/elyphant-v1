
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface CityStateFieldsProps {
  cityValue: string;
  stateValue: string;
  onCityChange: (value: string) => void;
  onStateChange: (value: string) => void;
}

const CityStateFields: React.FC<CityStateFieldsProps> = ({
  cityValue,
  stateValue,
  onCityChange,
  onStateChange
}) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="city">City</Label>
        <Input
          id="city"
          placeholder="City"
          value={cityValue || ""}
          onChange={(e) => onCityChange(e.target.value)}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="state">State/Province</Label>
        <Input
          id="state"
          placeholder="State/Province"
          value={stateValue || ""}
          onChange={(e) => onStateChange(e.target.value)}
        />
      </div>
    </div>
  );
};

export default CityStateFields;
