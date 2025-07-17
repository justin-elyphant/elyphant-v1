
import React from 'react';
import { Control } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import GooglePlacesAutocomplete from '@/components/forms/GooglePlacesAutocomplete';
import { StandardizedAddress } from '@/services/googlePlacesService';
import { standardizedToForm } from '@/utils/addressStandardization';

interface AddressFieldsProps {
  control: Control<any>;
}

export const AddressFields: React.FC<AddressFieldsProps> = ({ control }) => {
  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="recipientAddress"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <GooglePlacesAutocomplete
                value={field.value || ''}
                onChange={field.onChange}
                onAddressSelect={(standardizedAddress: StandardizedAddress) => {
                  const formAddr = standardizedToForm(standardizedAddress);
                  field.onChange(formAddr.street);
                  
                  // Auto-fill other fields
                  control._defaultValues.recipientCity = formAddr.city;
                  control._defaultValues.recipientState = formAddr.state;
                  control._defaultValues.recipientZip = formAddr.zipCode;
                }}
                label="Street Address"
                placeholder="Start typing the recipient's address..."
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="recipientAddress2"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Address Line 2</FormLabel>
            <FormControl>
              <Input placeholder="Apartment, Suite, Unit, etc. (optional)" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={control}
          name="recipientCity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>City</FormLabel>
              <FormControl>
                <Input placeholder="New York" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="recipientState"
          render={({ field }) => (
            <FormItem>
              <FormLabel>State</FormLabel>
              <FormControl>
                <Input placeholder="NY" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="recipientZip"
        render={({ field }) => (
          <FormItem>
            <FormLabel>ZIP Code</FormLabel>
            <FormControl>
              <Input placeholder="10001" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
