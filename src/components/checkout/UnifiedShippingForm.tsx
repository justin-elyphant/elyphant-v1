import React, { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Truck, Zap, Crown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import GooglePlacesAutocomplete from "@/components/forms/GooglePlacesAutocomplete";
import { StandardizedAddress } from "@/services/googlePlacesService";
import { standardizedToForm } from "@/utils/addressStandardization";
import { useDefaultAddress } from "@/hooks/useDefaultAddress";
import { ShippingOption } from "@/components/marketplace/zinc/services/shippingQuoteService";

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
  const { defaultAddress, loading } = useDefaultAddress();
  const addressWasAutoFilled = React.useRef(false);

  // State abbreviation to full name mapping
  const stateMapping: Record<string, string> = {
    'CA': 'California',
    'NY': 'New York',
    'TX': 'Texas',
    'FL': 'Florida',
    // Add more as needed
  };

  // Country abbreviation to full name mapping
  const countryMapping: Record<string, string> = {
    'US': 'United States',
    'USA': 'United States',
  };

  // Auto-fill the form with default address when it loads
  useEffect(() => {
    if (defaultAddress && !addressWasAutoFilled.current && !shippingInfo.address) {
      const mappedState = stateMapping[defaultAddress.address.state] || defaultAddress.address.state || 'California';
      const mappedCountry = countryMapping[defaultAddress.address.country] || defaultAddress.address.country || 'United States';
      
      onUpdate({
        name: defaultAddress.name,
        email: shippingInfo.email,
        address: defaultAddress.address.street,
        addressLine2: defaultAddress.address.address_line2 || '',
        city: defaultAddress.address.city,
        state: mappedState,
        zipCode: defaultAddress.address.zipCode,
        country: mappedCountry
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

  const getShippingIcon = (optionId: string) => {
    if (optionId.includes('prime')) return Crown;
    if (optionId.includes('expedited') || optionId.includes('express')) return Zap;
    return Truck;
  };

  const getIconColor = (optionId: string) => {
    if (optionId.includes('prime')) return "text-yellow-600";
    if (optionId.includes('expedited') || optionId.includes('express')) return "text-amber-500";
    return "text-blue-500";
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
      {/* Shipping Information Form */}
      <div className="rounded-lg border p-6">
        <div className="mb-6">
          <h3 className="text-lg font-medium">Shipping Information</h3>
        </div>
        
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

      {/* Shipping Method Selection */}
      <div className="rounded-lg border p-6">
        <h3 className="text-lg font-medium mb-4">Shipping Method</h3>
        
        {isLoadingShipping ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading shipping options...</span>
          </div>
        ) : shippingOptions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Please complete your shipping address to see available options</p>
          </div>
        ) : (
          <div className="space-y-3">
            {shippingOptions.map((option) => {
              const Icon = getShippingIcon(option.id);
              const iconColor = getIconColor(option.id);
              const isSelected = selectedShippingMethod === option.id;
              
              return (
                <Card 
                  key={option.id}
                  className={cn(
                    "cursor-pointer transition-all hover:border-gray-400",
                    isSelected && "border-2 border-primary"
                  )}
                  onClick={() => onShippingMethodChange(option.id)}
                >
                  <CardContent className="p-4 flex items-center">
                    <div className={cn("p-2 rounded-full mr-3", isSelected ? "bg-primary/10" : "bg-muted")}>
                      <Icon className={cn("h-5 w-5", iconColor)} />
                    </div>
                    
                    <div className="flex-grow">
                      <p className="font-medium">{option.name}</p>
                      <p className="text-sm text-muted-foreground">{option.delivery_time}</p>
                      {option.description && (
                        <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <p className="font-medium">
                        {option.price === 0 ? "FREE" : `$${option.price.toFixed(2)}`}
                      </p>
                      {isSelected && (
                        <Check className="h-4 w-4 text-primary ml-auto" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default UnifiedShippingForm;