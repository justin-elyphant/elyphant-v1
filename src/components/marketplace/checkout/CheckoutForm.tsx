
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShippingInfo } from './useCheckoutState';

interface CheckoutFormProps {
  shippingInfo: ShippingInfo;
  onUpdate: (data: Partial<ShippingInfo>) => void;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ shippingInfo, onUpdate }) => {
  const handleInputChange = (field: keyof ShippingInfo, value: string) => {
    onUpdate({ [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            value={shippingInfo.firstName || ''}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            placeholder="Enter first name"
          />
        </div>
        <div>
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            value={shippingInfo.lastName || ''}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            placeholder="Enter last name"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          value={shippingInfo.address || ''}
          onChange={(e) => handleInputChange('address', e.target.value)}
          placeholder="Enter street address"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={shippingInfo.city || ''}
            onChange={(e) => handleInputChange('city', e.target.value)}
            placeholder="Enter city"
          />
        </div>
        <div>
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            value={shippingInfo.state || ''}
            onChange={(e) => handleInputChange('state', e.target.value)}
            placeholder="Enter state"
          />
        </div>
        <div>
          <Label htmlFor="zipCode">ZIP Code</Label>
          <Input
            id="zipCode"
            value={shippingInfo.zipCode || ''}
            onChange={(e) => handleInputChange('zipCode', e.target.value)}
            placeholder="Enter ZIP code"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          type="tel"
          value={shippingInfo.phone || ''}
          onChange={(e) => handleInputChange('phone', e.target.value)}
          placeholder="Enter phone number"
        />
      </div>
    </div>
  );
};

export default CheckoutForm;
