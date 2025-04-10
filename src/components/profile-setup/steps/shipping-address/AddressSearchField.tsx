
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

  // Initialize the street query when the component mounts or value changes
  useEffect(() => {
    setStreetQuery(value || "");
  }, [value, setStreetQuery]);

  // Improved cursor handling for popover
  useEffect(() => {
    if (open) {
      popoverWasOpen.current = true;
    } else if (popoverWasOpen.current) {
      popoverWasOpen.current = false;
      // Don't focus immediately as it causes issues with the popover
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          
          // Place cursor at the end of the text
          const length = inputRef.current.value.length;
          inputRef.current.setSelectionRange(length, length);
        }
      }, 10);
    }
  }, [open]);

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
    
    // Focus back to input after selection with a small delay
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
    
    // Only open suggestions when we have at least 3 characters
    if (newValue.length > 2) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  };

  // Handle click inside the input to maintain focus
  const handleInputClick = () => {
    if (value && value.length > 2 && suggestions.length > 0) {
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
          // If popover is being closed, restore focus to input with a delay
          if (!isOpen && inputRef.current) {
            setTimeout(() => {
              if (inputRef.current) {
                inputRef.current.focus();
                
                // Place cursor at the end of text
                const length = inputRef.current.value.length;
                inputRef.current.setSelectionRange(length, length);
              }
            }, 10);
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
              onClick={handleInputClick}
              onFocus={() => {
                if (value && value.length > 2 && suggestions.length > 0) {
                  setOpen(true);
                }
              }}
              className="w-full"
              autoComplete="off" // Disable browser autocomplete
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
