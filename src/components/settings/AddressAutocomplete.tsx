
import React from "react";
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

  React.useEffect(() => {
    setStreetQuery(value);
  }, [value]);

  const handleAddressSelect = (address: any) => {
    onChange(address.address);
    selectAddress(address);
    onAddressSelect(address);
    setOpen(false);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="street">Street Address</Label>
      <Popover open={open && suggestions.length > 0} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Input
              id="street"
              value={value}
              onChange={(e) => {
                onChange(e.target.value);
                setStreetQuery(e.target.value);
                if (e.target.value.length > 4) {
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
            <CommandInput placeholder="Search address..." />
            <CommandList>
              <CommandEmpty>No addresses found.</CommandEmpty>
              <CommandGroup>
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
