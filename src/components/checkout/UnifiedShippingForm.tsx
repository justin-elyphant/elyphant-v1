
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { MapPin, Book } from 'lucide-react';
import { ShippingInfo } from '@/components/marketplace/checkout/useCheckoutState';
import { ShippingOption } from '@/components/marketplace/zinc/services/shippingQuoteService';
import AddressBookSelector from './components/AddressBookSelector';

interface UnifiedShippingFormProps {
  shippingInfo: ShippingInfo;
  onUpdate: (data: Partial<ShippingInfo>) => void;
  selectedShippingMethod: string;
  onShippingMethodChange: (method: string) => void;
  shippingOptions: ShippingOption[];
  isLoadingShipping: boolean;
}

const UnifiedShippingForm: React.FC<UnifiedShippingFormProps> = ({
  shippingInfo,
  onUpdate,
  selectedShippingMethod,
  onShippingMethodChange,
  shippingOptions,
  isLoadingShipping
}) => {
  const [showAddressBook, setShowAddressBook] = useState(false);

  const handleInputChange = (field: keyof ShippingInfo, value: string) => {
    onUpdate({ [field]: value });
  };

  const handleAddressSelect = (address: any) => {
    onUpdate({
      address: address.address.street || address.address.address_line1,
      addressLine2: address.address.address_line2 || '',
      city: address.address.city,
      state: address.address.state,
      zipCode: address.address.zipCode || address.address.zip_code,
      country: address.address.country || 'United States'
    });
    setShowAddressBook(false);
  };

  const states = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
    'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
    'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
    'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
    'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
    'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
    'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
  ];

  if (showAddressBook) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Book className="h-5 w-5" />
            Select from Address Book
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AddressBookSelector
            onSelect={handleAddressSelect}
            onClose={() => setShowAddressBook(false)}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Address Book Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Shipping Address</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddressBook(true)}
          className="flex items-center gap-2"
        >
          <Book className="h-4 w-4" />
          Address Book
        </Button>
      </div>

      {/* Contact Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Full Name *</Label>
          <Input
            id="name"
            value={shippingInfo.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Enter your full name"
            required
          />
        </div>
        <div>
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            value={shippingInfo.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="Enter your email"
            required
          />
        </div>
      </div>

      {/* Address Fields */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="address">Address *</Label>
          <Input
            id="address"
            value={shippingInfo.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            placeholder="Enter your street address"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
          <Input
            id="addressLine2"
            value={shippingInfo.addressLine2}
            onChange={(e) => handleInputChange('addressLine2', e.target.value)}
            placeholder="Apartment, suite, etc."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              value={shippingInfo.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              placeholder="Enter city"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="state">State *</Label>
            <Select value={shippingInfo.state} onValueChange={(value) => handleInputChange('state', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {states.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="zipCode">ZIP Code *</Label>
            <Input
              id="zipCode"
              value={shippingInfo.zipCode}
              onChange={(e) => handleInputChange('zipCode', e.target.value)}
              placeholder="Enter ZIP code"
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="country">Country *</Label>
          <Select value={shippingInfo.country} onValueChange={(value) => handleInputChange('country', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="United States">United States</SelectItem>
              <SelectItem value="Canada">Canada</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Shipping Options */}
      {shippingOptions.length > 0 && (
        <>
          <Separator />
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Shipping Method</h3>
            <RadioGroup value={selectedShippingMethod} onValueChange={onShippingMethodChange}>
              {shippingOptions.map((option) => (
                <div key={option.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <RadioGroupItem value={option.id} id={option.id} />
                  <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{option.name}</div>
                        <div className="text-sm text-muted-foreground">{option.delivery_time}</div>
                      </div>
                      <div className="font-bold">
                        ${option.price.toFixed(2)}
                      </div>
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
            
            {isLoadingShipping && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading shipping options...</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default UnifiedShippingForm;
