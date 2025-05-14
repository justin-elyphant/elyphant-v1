
import React from "react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface CountrySelectProps {
  value: string;
  onChange: (value: string) => void;
}

// List of common countries
const COUNTRIES = [
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
  { value: "MX", label: "Mexico" },
  { value: "UK", label: "United Kingdom" },
  { value: "FR", label: "France" },
  { value: "DE", label: "Germany" },
  { value: "JP", label: "Japan" },
  { value: "AU", label: "Australia" },
  { value: "BR", label: "Brazil" },
  { value: "IN", label: "India" },
];

export function CountrySelect({ value, onChange }: CountrySelectProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="country">Country</Label>
      <Select
        value={value}
        onValueChange={onChange}
      >
        <SelectTrigger id="country" className="w-full">
          <SelectValue placeholder="Select a country" />
        </SelectTrigger>
        <SelectContent>
          {COUNTRIES.map((country) => (
            <SelectItem key={country.value} value={country.value}>
              {country.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
