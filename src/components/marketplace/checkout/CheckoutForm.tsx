
import React, { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GooglePlacesAutocomplete from "@/components/forms/GooglePlacesAutocomplete";
import { StandardizedAddress } from "@/services/googlePlacesService";
import { standardizedToForm } from "@/utils/addressStandardization";
import { useDefaultAddress } from "@/hooks/useDefaultAddress";

interface ShippingInfo {
  name: string;
  email: string;
  address: string;
  addressLine2: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface CheckoutFormProps {
  shippingInfo: ShippingInfo;
  onUpdate: (data: Partial<ShippingInfo>) => void;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ shippingInfo, onUpdate }) => {
  const { defaultAddress, loading } = useDefaultAddress();
  const addressWasAutoFilled = React.useRef(false);

  // Auto-fill the form with default address when it loads
  useEffect(() => {
    if (defaultAddress && !addressWasAutoFilled.current && !shippingInfo.address) {
      onUpdate({
        name: defaultAddress.name,
        address: defaultAddress.address.street,
        addressLine2: '',
        city: defaultAddress.address.city,
        state: defaultAddress.address.state,
        zipCode: defaultAddress.address.zipCode,
        country: defaultAddress.address.country
      });
      addressWasAutoFilled.current = true;
    }
  }, [defaultAddress, shippingInfo.address, onUpdate]);
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

  console.log('Default address:', defaultAddress);
  
  return (
    <div className="rounded-lg border p-6">
      <h3 className="text-lg font-medium mb-4">Shipping Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input 
            id="name"
            name="name"
            value={shippingInfo.name}
            onChange={handleChange}
            placeholder="John Doe"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email"
            name="email"
            type="email"
            value={shippingInfo.email}
            onChange={handleChange}
            placeholder="john@example.com"
            required
          />
        </div>
        
        <div className="space-y-2 md:col-span-2">
          <GooglePlacesAutocomplete
            value={shippingInfo.address}
            onChange={(value) => onUpdate({ address: value })}
            onAddressSelect={handleGooglePlacesSelect}
            label="Street Address"
            placeholder="Start typing your address..."
          />
        </div>
        
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="addressLine2">Apartment, suite, etc. (optional)</Label>
          <Input
            id="addressLine2"
            name="addressLine2"
            value={shippingInfo.addressLine2 || ''}
            onChange={handleChange}
            placeholder="Apt, Suite, Unit, etc."
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input 
            id="city"
            name="city"
            value={shippingInfo.city}
            onChange={handleChange}
            placeholder="Anytown"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Select 
            name="state" 
            value={shippingInfo.state} 
            onValueChange={(value) => onUpdate({ state: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
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
            value={shippingInfo.zipCode}
            onChange={handleChange}
            placeholder="12345"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Select 
            name="country" 
            value={shippingInfo.country} 
            onValueChange={(value) => onUpdate({ country: value })}
            disabled
          >
            <SelectTrigger>
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="United States">United States</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Currently shipping to US only</p>
        </div>
      </div>
    </div>
  );
};

export default CheckoutForm;
