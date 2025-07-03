
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface GiftBudgetInputProps {
  value: number;
  onChange: (value: number) => void;
}

const GiftBudgetInput = ({ value, onChange }: GiftBudgetInputProps) => {
  return (
    <div className="space-y-2">
      <Label>Gift Budget ($)</Label>
      <Input 
        type="number" 
        placeholder="50" 
        min="1"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
};

export default GiftBudgetInput;
