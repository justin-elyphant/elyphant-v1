
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
      // Only restore focus after selecting a prediction
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          const length = inputRef.current.value.length;
          inputRef.current.setSelectionRange(length, length);
        }
      }, 50);
    }
  });

  // Sync external value with internal query only when external value changes
  useEffect(() => {
    setQuery(value);
  }, [value, setQuery]);

  // Auto-open popover when predictions arrive, but don't close it immediately
  useEffect(() => {
    if (predictions.length > 0 && !isLoading && query.length >= 3) {
      setOpen(true);
    } else if (query.length < 3) {
      setOpen(false);
    }
  }, [predictions.length, isLoading, query.length]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);
    onChange(newValue);
    
    // Close popover if input is too short
    if (newValue.length < 3) {
      setOpen(false);
    }
  };

  const handlePredictionSelect = async (prediction: any) => {
    await selectPrediction(prediction);
  };

  const handleInputClick = () => {
    if (query && query.length >= 3 && predictions.length > 0 && !isLoading) {
      setOpen(true);
    }
  };

  const handleInputFocus = () => {
    if (query.length >= 3 && predictions.length > 0 && !isLoading) {
      setOpen(true);
    }
  };

  // Prevent popover from stealing focus
  const handlePopoverOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setOpen(false);
    }
    // Don't set open to true here - let the useEffect handle it
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <Label htmlFor="address-input">{label}</Label>}
      <Popover 
        open={open && predictions.length > 0} 
        onOpenChange={handlePopoverOpenChange}
        modal={false}
      >
        <PopoverTrigger asChild>
          <div className="relative">
            <Input
              id="address-input"
              ref={inputRef}
              value={query}
              onChange={handleInputChange}
              onClick={handleInputClick}
              onFocus={handleInputFocus}
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
        <PopoverContent 
          className="p-0 w-[var(--radix-popover-trigger-width)]" 
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
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
