import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { useAddressAutocomplete } from "@/hooks/useAddressAutocomplete";

interface AddressSearchFieldProps {
  value: string;
  onChange: (street: string) => void;
  onAddressSelect: (address: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  }) => void;
}

const AddressSearchField: React.FC<AddressSearchFieldProps> = ({
  value,
  onChange,
  onAddressSelect
}) => {
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
    setStreetQuery(value || "");
  }, [value, setStreetQuery]);

  const handleAddressSelect = (address: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  }) => {
    selectAddress(address);
    onChange(address.address);
    onAddressSelect(address);
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
    onChange(newValue);
    setStreetQuery(newValue);
    if (newValue.length > 2) {
      setOpen(true);
    }
  };

  return (
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
              value={value || ""}
              onChange={handleInputChange}
              onFocus={() => {
                if (value && value.length > 2 && suggestions.length > 0) {
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
  );
};

export default AddressSearchField;
