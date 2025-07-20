
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Truck, Clock } from 'lucide-react';
import { ShippingInfo } from '@/components/marketplace/checkout/useCheckoutState';
import { ShippingOption } from '@/components/marketplace/zinc/services/shippingQuoteService';

interface UnifiedShippingFormProps {
  shippingInfo: ShippingInfo;
  onUpdate: (data: Partial<ShippingInfo>) => void;
  selectedShippingMethod: string;
  onShippingMethodChange: (method: string) => void;
  shippingOptions: ShippingOption[];
  isLoadingShipping: boolean;
}

// Complete US states mapping - handles abbreviations and full names
const stateMapping: Record<string, string> = {
  // Abbreviations to full names
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
  'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
  'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
  'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
  'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
  'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
  'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
  'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
  'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
  'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming',
  'DC': 'District of Columbia',
  // Full names to full names (for exact matches)
  'Alabama': 'Alabama', 'Alaska': 'Alaska', 'Arizona': 'Arizona', 'Arkansas': 'Arkansas', 'California': 'California',
  'Colorado': 'Colorado', 'Connecticut': 'Connecticut', 'Delaware': 'Delaware', 'Florida': 'Florida', 'Georgia': 'Georgia',
  'Hawaii': 'Hawaii', 'Idaho': 'Idaho', 'Illinois': 'Illinois', 'Indiana': 'Indiana', 'Iowa': 'Iowa',
  'Kansas': 'Kansas', 'Kentucky': 'Kentucky', 'Louisiana': 'Louisiana', 'Maine': 'Maine', 'Maryland': 'Maryland',
  'Massachusetts': 'Massachusetts', 'Michigan': 'Michigan', 'Minnesota': 'Minnesota', 'Mississippi': 'Mississippi', 'Missouri': 'Missouri',
  'Montana': 'Montana', 'Nebraska': 'Nebraska', 'Nevada': 'Nevada', 'New Hampshire': 'New Hampshire', 'New Jersey': 'New Jersey',
  'New Mexico': 'New Mexico', 'New York': 'New York', 'North Carolina': 'North Carolina', 'North Dakota': 'North Dakota', 'Ohio': 'Ohio',
  'Oklahoma': 'Oklahoma', 'Oregon': 'Oregon', 'Pennsylvania': 'Pennsylvania', 'Rhode Island': 'Rhode Island', 'South Carolina': 'South Carolina',
  'South Dakota': 'South Dakota', 'Tennessee': 'Tennessee', 'Texas': 'Texas', 'Utah': 'Utah', 'Vermont': 'Vermont',
  'Virginia': 'Virginia', 'Washington': 'Washington', 'West Virginia': 'West Virginia', 'Wisconsin': 'Wisconsin', 'Wyoming': 'Wyoming',
  'District of Columbia': 'District of Columbia'
};

const states = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
  'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
  'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
  'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
  'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
  'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
  'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming', 'District of Columbia'
];

const UnifiedShippingForm: React.FC<UnifiedShippingFormProps> = ({
  shippingInfo,
  onUpdate,
  selectedShippingMethod,
  onShippingMethodChange,
  shippingOptions,
  isLoadingShipping,
}) => {
  // Handle state value - convert abbreviation or ensure full name
  const getStateValue = (state: string): string => {
    if (!state) return '';
    const mappedState = stateMapping[state];
    console.log('State mapping:', state, '→', mappedState);
    return mappedState || state;
  };

  const handleInputChange = (field: keyof ShippingInfo, value: string) => {
    onUpdate({ [field]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Shipping Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={shippingInfo.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter your full name"
              required
            />
          </div>
          <div className="space-y-2">
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

        {/* Address Information */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Street Address *</Label>
            <Input
              id="address"
              value={shippingInfo.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Enter your street address"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="addressLine2">Apartment, Suite, etc. (Optional)</Label>
            <Input
              id="addressLine2"
              value={shippingInfo.addressLine2}
              onChange={(e) => handleInputChange('addressLine2', e.target.value)}
              placeholder="Apartment, suite, unit, building, floor, etc."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={shippingInfo.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="Enter city"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="state">State *</Label>
              <Select
                value={getStateValue(shippingInfo.state)}
                onValueChange={(value) => handleInputChange('state', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto bg-white z-50">
                  {states.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
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
        </div>

        {/* Shipping Methods */}
        <div className="space-y-4 pt-4 border-t">
          <Label className="text-base font-medium">Shipping Method</Label>
          
          {isLoadingShipping ? (
            <div className="flex items-center gap-2 py-4">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span className="text-sm text-muted-foreground">Loading shipping options...</span>
            </div>
          ) : (
            <RadioGroup
              value={selectedShippingMethod}
              onValueChange={onShippingMethodChange}
              className="space-y-3"
            >
              {shippingOptions.map((option) => (
                <div key={option.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value={option.id} id={option.id} />
                  <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        <span className="font-medium">{option.name}</span>
                      </div>
                      <span className="font-medium">${option.price.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{option.delivery_time}</span>
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UnifiedShippingForm;
