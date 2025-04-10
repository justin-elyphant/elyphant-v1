import React, { useState, useRef, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShippingAddress } from "@/types/supabase";
import { useAddressAutocomplete } from "@/hooks/useAddressAutocomplete";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2 } from "lucide-react";

interface ShippingAddressStepProps {
  value: ShippingAddress;
  onChange: (address: ShippingAddress) => void;
}

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

const ShippingAddressStep: React.FC<ShippingAddressStepProps> = ({ value, onChange }) => {
  const handleChange = (field: keyof ShippingAddress, newValue: string) => {
    onChange({
      ...value,
      [field]: newValue
    });
  };

  const {
    streetQuery,
    setStreetQuery,
    suggestions,
    loading,
    selectAddress
  } = useAddressAutocomplete();

  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverWasOpen = useRef(false);

  // Keep track of when the popover opens and closes to manage focus
  useEffect(() => {
    if (open) {
      popoverWasOpen.current = true;
    } else if (popoverWasOpen.current) {
      // If popover was previously open and now closed, restore focus to input
      popoverWasOpen.current = false;
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 0);
    }
  }, [open]);

  useEffect(() => {
    // Initialize the street query when the component mounts or value changes
    setStreetQuery(value.street || "");
  }, [value.street, setStreetQuery]);

  const handleAddressSelect = (address: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  }) => {
    selectAddress(address);
    onChange({
      street: address.address,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      country: address.country || value.country
    });
    setOpen(false);
    
    // Restore focus to the input element after selection
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 10);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    handleChange('street', newValue);
    setStreetQuery(newValue);
    if (newValue.length > 2) {
      setOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium">Where should gifts be delivered?</h3>
        <p className="text-sm text-muted-foreground">
          Your address is only shared with friends you explicitly allow
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="street">Street Address</Label>
          <Popover 
            open={open && suggestions.length > 0} 
            onOpenChange={(isOpen) => {
              setOpen(isOpen);
              // If popover is being closed, restore focus to input
              if (!isOpen && inputRef.current) {
                setTimeout(() => inputRef.current?.focus(), 10);
              }
            }}
          >
            <PopoverTrigger asChild>
              <div className="relative">
                <Input
                  id="street"
                  ref={inputRef}
                  placeholder="123 Main St"
                  value={value.street || ""}
                  onChange={handleInputChange}
                  onFocus={() => {
                    if (value.street && value.street.length > 2 && suggestions.length > 0) {
                      setOpen(true);
                    }
                  }}
                  className="w-full"
                />
                {loading && (
                  <div className="absolute right-3 top-3">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]" align="start">
              <Command>
                <CommandList>
                  <CommandEmpty>No addresses found.</CommandEmpty>
                  <CommandGroup heading="Suggested addresses">
                    {suggestions.map((address, index) => (
                      <CommandItem
                        key={index}
                        value={address.address}
                        onSelect={() => handleAddressSelect(address)}
                      >
                        {address.address}, {address.city}, {address.state} {address.zipCode}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              placeholder="City"
              value={value.city || ""}
              onChange={(e) => handleChange('city', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="state">State/Province</Label>
            <Input
              id="state"
              placeholder="State/Province"
              value={value.state || ""}
              onChange={(e) => handleChange('state', e.target.value)}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="zipCode">ZIP/Postal Code</Label>
            <Input
              id="zipCode"
              placeholder="ZIP/Postal Code"
              value={value.zipCode || ""}
              onChange={(e) => handleChange('zipCode', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Select 
              value={value.country || ""} 
              onValueChange={(val) => handleChange('country', val)}
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
      </div>
    </div>
  );
};

export default ShippingAddressStep;
