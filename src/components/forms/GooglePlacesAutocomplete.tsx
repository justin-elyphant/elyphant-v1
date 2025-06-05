
import React, { useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Loader2, MapPin } from 'lucide-react';
import { useGooglePlacesAutocomplete } from '@/hooks/useGooglePlacesAutocomplete';
import { StandardizedAddress } from '@/services/googlePlacesService';

interface GooglePlacesAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onAddressSelect: (address: StandardizedAddress) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
}

const GooglePlacesAutocomplete: React.FC<GooglePlacesAutocompleteProps> = ({
  value,
  onChange,
  onAddressSelect,
  placeholder = "Start typing an address...",
  label = "Address",
  disabled = false,
  className = ""
}) => {
  const [open, setOpen] = React.useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverWasOpen = useRef(false);

  const {
    query,
    setQuery,
    predictions,
    isLoading,
    selectPrediction
  } = useGooglePlacesAutocomplete({
    onAddressSelect: (address) => {
      onAddressSelect(address);
      setOpen(false);
    }
  });

  // Sync external value with internal query
  useEffect(() => {
    if (value !== query) {
      setQuery(value);
    }
  }, [value, setQuery]);

  // Handle focus restoration after popover closes
  useEffect(() => {
    if (open) {
      popoverWasOpen.current = true;
    } else if (popoverWasOpen.current) {
      popoverWasOpen.current = false;
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          const length = inputRef.current.value.length;
          inputRef.current.setSelectionRange(length, length);
        }
      }, 10);
    }
  }, [open]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setQuery(newValue);
    
    if (newValue.length >= 3) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  };

  const handlePredictionSelect = async (prediction: any) => {
    await selectPrediction(prediction);
  };

  const handleInputClick = () => {
    if (value && value.length >= 3 && predictions.length > 0) {
      setOpen(true);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <Label htmlFor="address-input">{label}</Label>}
      <Popover 
        open={open && predictions.length > 0} 
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen && inputRef.current) {
            setTimeout(() => {
              if (inputRef.current) {
                inputRef.current.focus();
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
              id="address-input"
              ref={inputRef}
              value={value}
              onChange={handleInputChange}
              onClick={handleInputClick}
              onFocus={() => {
                if (value.length >= 3 && predictions.length > 0) {
                  setOpen(true);
                }
              }}
              placeholder={placeholder}
              disabled={disabled}
              className="w-full"
              autoComplete="off"
            />
            {isLoading && (
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
                {predictions.map((prediction, index) => (
                  <CommandItem
                    key={prediction.place_id}
                    value={prediction.description}
                    onSelect={() => handlePredictionSelect(prediction)}
                    className="flex items-start gap-2"
                  >
                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-medium">{prediction.structured_formatting.main_text}</span>
                      <span className="text-sm text-muted-foreground">
                        {prediction.structured_formatting.secondary_text}
                      </span>
                    </div>
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

export default GooglePlacesAutocomplete;
