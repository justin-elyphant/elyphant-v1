import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ShippingInfo {
  name: string;
  email: string;
  address: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface CheckoutShippingFormProps {
  shippingInfo: ShippingInfo;
  onUpdateShippingInfo: (data: Partial<ShippingInfo>) => void;
}

const CheckoutShippingForm: React.FC<CheckoutShippingFormProps> = ({
  shippingInfo,
  onUpdateShippingInfo
}) => {
  // State mapping from abbreviations to full names
  const stateMapping: { [key: string]: string } = {
    'CA': 'California',
    'NY': 'New York',
    'TX': 'Texas',
    'FL': 'Florida',
    'WA': 'Washington',
    'OR': 'Oregon',
    'NV': 'Nevada',
    'AZ': 'Arizona',
    'CO': 'Colorado',
    'UT': 'Utah',
    'NM': 'New Mexico',
    'ID': 'Idaho',
    'MT': 'Montana',
    'WY': 'Wyoming',
    'ND': 'North Dakota',
    'SD': 'South Dakota',
    'NE': 'Nebraska',
    'KS': 'Kansas',
    'OK': 'Oklahoma',
    'AR': 'Arkansas',
    'LA': 'Louisiana',
    'MS': 'Mississippi',
    'AL': 'Alabama',
    'TN': 'Tennessee',
    'KY': 'Kentucky',
    'IN': 'Indiana',
    'OH': 'Ohio',
    'MI': 'Michigan',
    'IL': 'Illinois',
    'WI': 'Wisconsin',
    'MN': 'Minnesota',
    'IA': 'Iowa',
    'MO': 'Missouri',
    'GA': 'Georgia',
    'SC': 'South Carolina',
    'NC': 'North Carolina',
    'VA': 'Virginia',
    'WV': 'West Virginia',
    'MD': 'Maryland',
    'DE': 'Delaware',
    'PA': 'Pennsylvania',
    'NJ': 'New Jersey',
    'CT': 'Connecticut',
    'RI': 'Rhode Island',
    'MA': 'Massachusetts',
    'VT': 'Vermont',
    'NH': 'New Hampshire',
    'ME': 'Maine',
    'AK': 'Alaska',
    'HI': 'Hawaii'
  };

  // Country mapping from codes to full names
  const countryMapping: { [key: string]: string } = {
    'US': 'United States',
    'CA': 'Canada'
  };

  // Get display values for dropdowns
  const getStateDisplayValue = () => {
    return stateMapping[shippingInfo.state] || shippingInfo.state;
  };

  const getCountryDisplayValue = () => {
    return countryMapping[shippingInfo.country] || shippingInfo.country;
  };
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          value={shippingInfo.name}
          onChange={(e) => onUpdateShippingInfo({ name: e.target.value })}
          placeholder="John Doe"
        />
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={shippingInfo.email}
          onChange={(e) => onUpdateShippingInfo({ email: e.target.value })}
          placeholder="john@example.com"
        />
      </div>

      <div>
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          value={shippingInfo.address}
          onChange={(e) => onUpdateShippingInfo({ address: e.target.value })}
          placeholder="123 Main Street"
        />
      </div>

      <div>
        <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
        <Input
          id="addressLine2"
          value={shippingInfo.addressLine2 || ''}
          onChange={(e) => onUpdateShippingInfo({ addressLine2: e.target.value })}
          placeholder="Apt, suite, etc."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={shippingInfo.city}
            onChange={(e) => onUpdateShippingInfo({ city: e.target.value })}
            placeholder="New York"
          />
        </div>
        <div>
          <Label htmlFor="state">State</Label>
          <Select value={getStateDisplayValue()} onValueChange={(value) => onUpdateShippingInfo({ state: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Alabama">Alabama</SelectItem>
              <SelectItem value="Alaska">Alaska</SelectItem>
              <SelectItem value="Arizona">Arizona</SelectItem>
              <SelectItem value="Arkansas">Arkansas</SelectItem>
              <SelectItem value="California">California</SelectItem>
              <SelectItem value="Colorado">Colorado</SelectItem>
              <SelectItem value="Connecticut">Connecticut</SelectItem>
              <SelectItem value="Delaware">Delaware</SelectItem>
              <SelectItem value="Florida">Florida</SelectItem>
              <SelectItem value="Georgia">Georgia</SelectItem>
              <SelectItem value="Hawaii">Hawaii</SelectItem>
              <SelectItem value="Idaho">Idaho</SelectItem>
              <SelectItem value="Illinois">Illinois</SelectItem>
              <SelectItem value="Indiana">Indiana</SelectItem>
              <SelectItem value="Iowa">Iowa</SelectItem>
              <SelectItem value="Kansas">Kansas</SelectItem>
              <SelectItem value="Kentucky">Kentucky</SelectItem>
              <SelectItem value="Louisiana">Louisiana</SelectItem>
              <SelectItem value="Maine">Maine</SelectItem>
              <SelectItem value="Maryland">Maryland</SelectItem>
              <SelectItem value="Massachusetts">Massachusetts</SelectItem>
              <SelectItem value="Michigan">Michigan</SelectItem>
              <SelectItem value="Minnesota">Minnesota</SelectItem>
              <SelectItem value="Mississippi">Mississippi</SelectItem>
              <SelectItem value="Missouri">Missouri</SelectItem>
              <SelectItem value="Montana">Montana</SelectItem>
              <SelectItem value="Nebraska">Nebraska</SelectItem>
              <SelectItem value="Nevada">Nevada</SelectItem>
              <SelectItem value="New Hampshire">New Hampshire</SelectItem>
              <SelectItem value="New Jersey">New Jersey</SelectItem>
              <SelectItem value="New Mexico">New Mexico</SelectItem>
              <SelectItem value="New York">New York</SelectItem>
              <SelectItem value="North Carolina">North Carolina</SelectItem>
              <SelectItem value="North Dakota">North Dakota</SelectItem>
              <SelectItem value="Ohio">Ohio</SelectItem>
              <SelectItem value="Oklahoma">Oklahoma</SelectItem>
              <SelectItem value="Oregon">Oregon</SelectItem>
              <SelectItem value="Pennsylvania">Pennsylvania</SelectItem>
              <SelectItem value="Rhode Island">Rhode Island</SelectItem>
              <SelectItem value="South Carolina">South Carolina</SelectItem>
              <SelectItem value="South Dakota">South Dakota</SelectItem>
              <SelectItem value="Tennessee">Tennessee</SelectItem>
              <SelectItem value="Texas">Texas</SelectItem>
              <SelectItem value="Utah">Utah</SelectItem>
              <SelectItem value="Vermont">Vermont</SelectItem>
              <SelectItem value="Virginia">Virginia</SelectItem>
              <SelectItem value="Washington">Washington</SelectItem>
              <SelectItem value="West Virginia">West Virginia</SelectItem>
              <SelectItem value="Wisconsin">Wisconsin</SelectItem>
              <SelectItem value="Wyoming">Wyoming</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="zipCode">ZIP Code</Label>
          <Input
            id="zipCode"
            value={shippingInfo.zipCode}
            onChange={(e) => onUpdateShippingInfo({ zipCode: e.target.value })}
            placeholder="12345"
          />
        </div>
        <div>
          <Label htmlFor="country">Country</Label>
          <Select value={getCountryDisplayValue()} onValueChange={(value) => onUpdateShippingInfo({ country: value })}>
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
    </div>
  );
};

export default CheckoutShippingForm;