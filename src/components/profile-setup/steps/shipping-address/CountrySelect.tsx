
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CountrySelectProps {
  value: string;
  onChange: (country: string) => void;
}

const CountrySelect: React.FC<CountrySelectProps> = ({ value, onChange }) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select country" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="US">United States</SelectItem>
        <SelectItem value="CA">Canada</SelectItem>
        <SelectItem value="MX">Mexico</SelectItem>
        <SelectItem value="UK">United Kingdom</SelectItem>
        <SelectItem value="AU">Australia</SelectItem>
        <SelectItem value="FR">France</SelectItem>
        <SelectItem value="DE">Germany</SelectItem>
        <SelectItem value="JP">Japan</SelectItem>
        <SelectItem value="CN">China</SelectItem>
        <SelectItem value="BR">Brazil</SelectItem>
        <SelectItem value="IN">India</SelectItem>
      </SelectContent>
    </Select>
  );
};

export default CountrySelect;
