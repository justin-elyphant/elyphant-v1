import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface Address {
  name: string;
  address: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface AddressFormProps {
  address: Address | null;
  onChange: (address: Address) => void;
  onValidate?: (isValid: boolean) => void;
  disabled?: boolean;
}

const AddressForm: React.FC<AddressFormProps> = ({
  address,
  onChange,
  onValidate,
  disabled = false
}) => {
  const [addressData, setAddressData] = useState<Address>(
    address || {
      name: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States'
    }
  );
  
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const handleChange = (field: keyof Address, value: string) => {
    const newAddressData = { ...addressData, [field]: value };
    setAddressData(newAddressData);
    
    // Clear error for this field if it exists
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
    
    onChange(newAddressData);
    validateAddress(newAddressData);
  };

  const validateAddress = (data: Address) => {
    const newErrors: {[key: string]: string} = {};
    
    // Required fields
    const requiredFields: (keyof Address)[] = ['name', 'address', 'city', 'state', 'zipCode', 'country'];
    requiredFields.forEach(field => {
      if (!data[field]) {
        newErrors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
      }
    });
    
    // Zip code format (US)
    if (data.country === 'United States' && data.zipCode && !/^\d{5}(-\d{4})?$/.test(data.zipCode)) {
      newErrors.zipCode = 'Invalid US zip code format';
    }
    
    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    if (onValidate) {
      onValidate(isValid);
    }
    
    return isValid;
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input 
          id="name"
          value={addressData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          disabled={disabled}
          className={errors.name ? 'border-destructive' : ''}
        />
        {errors.name && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="h-4 w-4" /> {errors.name}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Street Address</Label>
        <Input 
          id="address"
          value={addressData.address}
          onChange={(e) => handleChange('address', e.target.value)}
          disabled={disabled}
          className={errors.address ? 'border-destructive' : ''}
        />
        {errors.address && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="h-4 w-4" /> {errors.address}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="address2">Apt, Suite, etc. (Optional)</Label>
        <Input 
          id="address2"
          value={addressData.address2 || ''}
          onChange={(e) => handleChange('address2', e.target.value)}
          disabled={disabled}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input 
            id="city"
            value={addressData.city}
            onChange={(e) => handleChange('city', e.target.value)}
            disabled={disabled}
            className={errors.city ? 'border-destructive' : ''}
          />
          {errors.city && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-4 w-4" /> {errors.city}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Input 
            id="state"
            value={addressData.state}
            onChange={(e) => handleChange('state', e.target.value)}
            disabled={disabled}
            className={errors.state ? 'border-destructive' : ''}
          />
          {errors.state && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-4 w-4" /> {errors.state}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="zipCode">Zip Code</Label>
          <Input 
            id="zipCode"
            value={addressData.zipCode}
            onChange={(e) => handleChange('zipCode', e.target.value)}
            disabled={disabled}
            className={errors.zipCode ? 'border-destructive' : ''}
          />
          {errors.zipCode && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-4 w-4" /> {errors.zipCode}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input 
            id="country"
            value={addressData.country}
            onChange={(e) => handleChange('country', e.target.value)}
            disabled={disabled}
            className={errors.country ? 'border-destructive' : ''}
          />
          {errors.country && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-4 w-4" /> {errors.country}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddressForm;