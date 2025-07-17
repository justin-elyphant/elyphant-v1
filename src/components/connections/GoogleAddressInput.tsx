import React, { useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface GoogleAddressInputProps {
  value: string;
  onChange: (value: string) => void;
  onAddressSelect?: (address: {
    street: string;
    address_line_2: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  }) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
}

const GoogleAddressInput: React.FC<GoogleAddressInputProps> = ({
  value,
  onChange,
  onAddressSelect,
  placeholder = "Start typing an address...",
  label = "Search Address",
  required = false
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadGoogleMapsScript = () => {
      // Check if Google Maps is already loaded
      if ((window as any).google && (window as any).google.maps) {
        initializeAutocomplete();
        return;
      }

      // Create script element
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBFw0Qby_gJ-VVX3AV4LgGRmyKjCjP6xKE&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initializeAutocomplete;
      document.head.appendChild(script);
    };

    const initializeAutocomplete = () => {
      if (!inputRef.current) return;

      const autocomplete = new (window as any).google.maps.places.Autocomplete(
        inputRef.current,
        {
          types: ['address'],
          componentRestrictions: { country: 'us' }
        }
      );

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.formatted_address) {
          onChange(place.formatted_address);
          
          if (onAddressSelect) {
            const components = place.address_components;
            const addressData = {
              street: '',
              address_line_2: '',
              city: '',
              state: '',
              zipCode: '',
              country: 'US'
            };

            components.forEach((component: any) => {
              const types = component.types;
              if (types.includes('street_number')) {
                addressData.street = component.long_name + ' ';
              } else if (types.includes('route')) {
                addressData.street += component.long_name;
              } else if (types.includes('locality')) {
                addressData.city = component.long_name;
              } else if (types.includes('administrative_area_level_1')) {
                addressData.state = component.short_name;
              } else if (types.includes('postal_code')) {
                addressData.zipCode = component.long_name;
              } else if (types.includes('country')) {
                addressData.country = component.short_name;
              }
            });

            onAddressSelect(addressData);
          }
        }
      });
    };

    loadGoogleMapsScript();
  }, [onChange, onAddressSelect]);

  return (
    <div className="space-y-2">
      <Label htmlFor="google-address">{label}</Label>
      <Input
        ref={inputRef}
        id="google-address"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
};

export default GoogleAddressInput;