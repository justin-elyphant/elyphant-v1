
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, User, Mail, Phone, Gift } from 'lucide-react';
import GooglePlacesAutocomplete from '@/components/forms/GooglePlacesAutocomplete';
import { StandardizedAddress } from '@/services/googlePlacesService';
import { standardizedToForm } from '@/utils/addressStandardization';

interface SmartCheckoutFormProps {
  shippingInfo: any;
  onUpdate: (data: any) => void;
  showBillingAddress?: boolean;
  isGift?: boolean;
}

const SmartCheckoutForm: React.FC<SmartCheckoutFormProps> = ({
  shippingInfo,
  onUpdate,
  showBillingAddress = false,
  isGift = false
}) => {
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [estimatedShipping, setEstimatedShipping] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({
      [e.target.name]: e.target.value
    });
  };

  const handleGooglePlacesSelect = (standardizedAddress: StandardizedAddress) => {
    const formAddr = standardizedToForm(standardizedAddress);
    onUpdate({
      address: formAddr.street,
      city: formAddr.city,
      state: formAddr.state,
      zipCode: formAddr.zipCode,
      country: formAddr.country
    });

    // Estimate shipping time based on zip code
    if (formAddr.zipCode) {
      estimateShippingTime(formAddr.zipCode);
    }
  };

  const estimateShippingTime = (zipCode: string) => {
    // Simple shipping estimation logic
    const zip = parseInt(zipCode);
    if (zip >= 90000 && zip <= 96999) {
      setEstimatedShipping('1-2 business days (West Coast)');
    } else if (zip >= 10000 && zip <= 19999) {
      setEstimatedShipping('2-3 business days (Northeast)');
    } else {
      setEstimatedShipping('2-4 business days');
    }
  };

  const states = [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", 
    "Colorado", "Connecticut", "Delaware", "Florida", "Georgia", 
    "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", 
    "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", 
    "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", 
    "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", 
    "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", 
    "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", 
    "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", 
    "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-6">
        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
          {isGift ? <Gift className="h-5 w-5" /> : <User className="h-5 w-5" />}
          {isGift ? 'Recipient Information' : 'Your Information'}
        </h3>
        
        {/* Basic Information */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Full Name
              </Label>
              <Input 
                id="name"
                name="name"
                value={shippingInfo.name || ''}
                onChange={handleChange}
                placeholder="John Doe"
                required
                className="transition-all focus:ring-2 focus:ring-primary/20"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input 
                id="email"
                name="email"
                type="email"
                value={shippingInfo.email || ''}
                onChange={handleChange}
                placeholder="john@example.com"
                required
                className="transition-all focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Address with Google Places */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Address
            </Label>
            <GooglePlacesAutocomplete
              value={shippingInfo.address || ''}
              onChange={(value) => onUpdate({ address: value })}
              onAddressSelect={handleGooglePlacesSelect}
              placeholder="Start typing your address..."
              className="transition-all focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* City, State, ZIP in a row */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input 
                id="city"
                name="city"
                value={shippingInfo.city || ''}
                onChange={handleChange}
                placeholder="Anytown"
                required
                className="transition-all focus:ring-2 focus:ring-primary/20"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Select 
                name="state" 
                value={shippingInfo.state || ''} 
                onValueChange={(value) => onUpdate({ state: value })}
              >
                <SelectTrigger className="transition-all focus:ring-2 focus:ring-primary/20">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent className="bg-white border shadow-lg z-50 max-h-60 overflow-y-auto">
                  {states.map(state => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="zipCode">ZIP Code</Label>
              <Input 
                id="zipCode"
                name="zipCode"
                value={shippingInfo.zipCode || ''}
                onChange={handleChange}
                placeholder="12345"
                required
                className="transition-all focus:ring-2 focus:ring-primary/20"
                onBlur={(e) => {
                  if (e.target.value) {
                    estimateShippingTime(e.target.value);
                  }
                }}
              />
            </div>
          </div>

          {/* Estimated shipping display */}
          {estimatedShipping && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800">
                <strong>Estimated delivery:</strong> {estimatedShipping}
              </p>
            </div>
          )}

          {/* Progressive disclosure for phone */}
          {!showAdvancedFields && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvancedFields(true)}
              className="text-primary hover:text-primary/80"
            >
              + Add phone number (optional)
            </Button>
          )}

          {showAdvancedFields && (
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Number (Optional)
              </Label>
              <Input 
                id="phone"
                name="phone"
                value={shippingInfo.phone || ''}
                onChange={handleChange}
                placeholder="(555) 123-4567"
                className="transition-all focus:ring-2 focus:ring-primary/20"
              />
            </div>
          )}
        </div>
      </div>

      {/* Billing address section */}
      {showBillingAddress && (
        <div className="rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Billing Address</h3>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sameAsBilling"
                checked={sameAsBilling}
                onCheckedChange={(checked) => setSameAsBilling(checked === true)}
              />
              <Label htmlFor="sameAsBilling" className="text-sm cursor-pointer">
                Same as shipping address
              </Label>
            </div>
          </div>

          {!sameAsBilling && (
            <div className="text-center py-8 text-muted-foreground">
              <p>Billing address form would go here</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SmartCheckoutForm;
