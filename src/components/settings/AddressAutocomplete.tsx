import React, { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Loader2 } from "lucide-react";
import { useAddressAutocomplete } from "@/hooks/useAddressAutocomplete";

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onAddressSelect: (address: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  }) => void;
  disabled?: boolean;
}

const AddressAutocomplete = ({
  value,
  onChange,
  onAddressSelect,
  disabled = false
}: AddressAutocompleteProps) => {
  const {
    streetQuery,
    setStreetQuery,
    suggestions,
    loading,
    selectAddress
  } = useAddressAutocomplete();
  
  const [open, setOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const popoverWasOpen = React.useRef(false);

  React.useEffect(() => {
    setStreetQuery(value);
  }, [value, setStreetQuery]);

  useEffect(() => {
    if (open) {
      popoverWasOpen.current = true;
    } else if (popoverWasOpen.current) {
      popoverWasOpen.current = false;
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 0);
    }
  }, [open]);

  const handleAddressSelect = (address: any) => {
    onChange(address.address);
    selectAddress(address);
    onAddressSelect(address);
    setOpen(false);
    
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
              value={value}
              onChange={handleInputChange}
              onFocus={() => {
                if (value.length > 2 && suggestions.length > 0) {
                  setOpen(true);
                }
              }}
              placeholder="123 Main St"
              disabled={disabled}
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

export default AddressAutocomplete;
