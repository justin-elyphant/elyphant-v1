import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Loader2 } from 'lucide-react';
import { useProfile } from '@/contexts/profile/ProfileContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import GooglePlacesAutocomplete from '@/components/forms/GooglePlacesAutocomplete';
import { StandardizedAddress } from '@/services/googlePlacesService';

interface AddressData {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface AddNewAddressFormProps {
  onAddressAdded: (address: any) => void;
  onCancel: () => void;
  defaultName?: string;
}

const AddNewAddressForm: React.FC<AddNewAddressFormProps> = ({
  onAddressAdded,
  onCancel,
  defaultName = ''
}) => {
  const { profile } = useProfile();
  const [loading, setLoading] = useState(false);
  const [addressName, setAddressName] = useState(defaultName);
  const [address, setAddress] = useState<AddressData>({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US'
  });
  const [isDefault, setIsDefault] = useState(false);

  const handlePlaceSelect = (placeData: StandardizedAddress) => {
    if (placeData) {
      setAddress({
        street: placeData.street || '',
        city: placeData.city || '',
        state: placeData.state || '',
        zipCode: placeData.zipCode || '',
        country: placeData.country || 'US'
      });
    }
  };

  const handleSaveAddress = async () => {
    if (!profile || !addressName.trim() || !address.street || !address.city) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      // If this is being set as default, first unset other defaults
      if (isDefault) {
        await supabase
          .from('user_addresses')
          .update({ is_default: false })
          .eq('user_id', profile.id);
      }

      // Save new address
      const { data, error } = await supabase
        .from('user_addresses')
        .insert({
          user_id: profile.id,
          name: addressName.trim(),
          address: address,
          is_default: isDefault
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(`Address "${addressName}" saved successfully`);
      onAddressAdded(data);
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error("Failed to save address");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = addressName.trim() && address.street && address.city && address.state && address.zipCode;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Add New Address
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="addressName">Address Label *</Label>
          <Input
            id="addressName"
            value={addressName}
            onChange={(e) => setAddressName(e.target.value)}
            placeholder="e.g., Home, Work, Mom's House"
            className="mt-1"
          />
        </div>

        <div>
          <GooglePlacesAutocomplete 
            value={address.street}
            onChange={(value) => setAddress(prev => ({ ...prev, street: value }))}
            onAddressSelect={handlePlaceSelect}
            placeholder="Start typing an address..."
            label="Street Address *"
          />
        </div>

        {/* Manual address fields for override/completion */}
        <div className="grid grid-cols-1 gap-3">
          <div>
            <Label htmlFor="street">Street Address *</Label>
            <Input
              id="street"
              value={address.street}
              onChange={(e) => setAddress(prev => ({ ...prev, street: e.target.value }))}
              placeholder="123 Main Street"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={address.city}
                onChange={(e) => setAddress(prev => ({ ...prev, city: e.target.value }))}
                placeholder="New York"
              />
            </div>
            <div>
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                value={address.state}
                onChange={(e) => setAddress(prev => ({ ...prev, state: e.target.value }))}
                placeholder="NY"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="zipCode">ZIP Code *</Label>
              <Input
                id="zipCode"
                value={address.zipCode}
                onChange={(e) => setAddress(prev => ({ ...prev, zipCode: e.target.value }))}
                placeholder="10001"
              />
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={address.country}
                onChange={(e) => setAddress(prev => ({ ...prev, country: e.target.value }))}
                placeholder="US"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="default"
            checked={isDefault}
            onCheckedChange={(checked) => setIsDefault(checked as boolean)}
          />
          <Label htmlFor="default" className="text-sm">
            Set as default address
          </Label>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button 
            variant="outline" 
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveAddress}
            disabled={loading || !isFormValid}
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Address
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AddNewAddressForm;