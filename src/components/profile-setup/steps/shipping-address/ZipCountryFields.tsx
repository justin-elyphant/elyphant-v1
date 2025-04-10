
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Common countries for shipping
const countries = [
  "United States",
  "Canada",
  "United Kingdom",
  "Australia",
  "Germany",
  "France",
  "Japan",
  "China",
  "Brazil",
  "Mexico",
  "India"
];

interface ZipCountryFieldsProps {
  zipValue: string;
  countryValue: string;
  onZipChange: (value: string) => void;
  onCountryChange: (value: string) => void;
}

const ZipCountryFields: React.FC<ZipCountryFieldsProps> = ({
  zipValue,
  countryValue,
  onZipChange,
  onCountryChange
}) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="zipCode">ZIP/Postal Code</Label>
        <Input
          id="zipCode"
          placeholder="ZIP/Postal Code"
          value={zipValue || ""}
          onChange={(e) => onZipChange(e.target.value)}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="country">Country</Label>
        <Select 
          value={countryValue || ""} 
          onValueChange={onCountryChange}
        >
          <SelectTrigger id="country">
            <SelectValue placeholder="Select Country" />
          </SelectTrigger>
          <SelectContent>
            {countries.map((country) => (
              <SelectItem key={country} value={country}>
                {country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default ZipCountryFields;
