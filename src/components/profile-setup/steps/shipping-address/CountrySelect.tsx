
import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CountrySelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
}

const CountrySelect: React.FC<CountrySelectProps> = ({
  value,
  onChange,
  disabled = false,
  required = false,
}) => {
  const countries = [
    { code: "US", name: "United States" },
    { code: "CA", name: "Canada" },
    { code: "MX", name: "Mexico" },
    { code: "GB", name: "United Kingdom" },
    { code: "AU", name: "Australia" },
    { code: "DE", name: "Germany" },
    { code: "FR", name: "France" },
    { code: "JP", name: "Japan" },
    { code: "CN", name: "China" },
    { code: "IN", name: "India" },
    // Add more countries as needed
  ];

  return (
    <Select
      value={value}
      onValueChange={onChange}
      disabled={disabled}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a country" />
      </SelectTrigger>
      <SelectContent>
        {countries.map((country) => (
          <SelectItem key={country.code} value={country.code}>
            {country.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CountrySelect;
