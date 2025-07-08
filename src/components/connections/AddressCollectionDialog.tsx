import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Plus, X } from 'lucide-react';
import { useProfile } from '@/contexts/profile/ProfileContext';
import GooglePlacesAutocomplete from '@/components/forms/GooglePlacesAutocomplete';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AddressData {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface AddressCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connectionName: string;
  connectionId: string;
  onAddressCollected: (address: AddressData) => void;
  title?: string;
  description?: string;
}

const AddressCollectionDialog: React.FC<AddressCollectionDialogProps> = ({
  open,
  onOpenChange,
  connectionName,
  connectionId,
  onAddressCollected,
  title = "Add Shipping Address",
  description = "Add a shipping address to make future gifting easier"
}) => {
  const { profile } = useProfile();
  const [loading, setLoading] = useState(false);
  const [addressName, setAddressName] = useState(`${connectionName}'s Address`);
  const [address, setAddress] = useState<AddressData>({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US'
  });

  const handlePlaceSelect = (placeData: any) => {
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
    if (!profile || !address.street || !address.city) {
      toast.error("Please fill in all required address fields");
      return;
    }

    setLoading(true);
    try {
      // Save address to user_addresses table
      const { error } = await supabase
        .from('user_addresses')
        .insert({
          user_id: profile.id,
          name: addressName,
          address: address,
          is_default: false
        });

      if (error) throw error;

      toast.success(`Address saved for ${connectionName}`);
      onAddressCollected(address);
      onOpenChange(false);
      
      // Reset form
      setAddressName(`${connectionName}'s Address`);
      setAddress({
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'US'
      });
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error("Failed to save address");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {title}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {description} for <span className="font-medium">{connectionName}</span>
          </p>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="addressName">Address Label</Label>
            <Input
              id="addressName"
              value={addressName}
              onChange={(e) => setAddressName(e.target.value)}
              placeholder="e.g., John's Home, Sarah's Office"
              className="mt-1"
            />
          </div>

          <div>
            <Label>Address</Label>
            <div className="mt-1">
              <GooglePlacesAutocomplete 
                value={address.street}
                onChange={(value) => setAddress(prev => ({ ...prev, street: value }))}
                onAddressSelect={handlePlaceSelect}
                placeholder="Start typing an address..."
              />
            </div>
          </div>

          {/* Manual address fields as fallback */}
          <div className="grid grid-cols-1 gap-3">
            <div>
              <Label htmlFor="street">Street Address</Label>
              <Input
                id="street"
                value={address.street}
                onChange={(e) => setAddress(prev => ({ ...prev, street: e.target.value }))}
                placeholder="123 Main Street"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={address.city}
                  onChange={(e) => setAddress(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="New York"
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
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
                <Label htmlFor="zipCode">ZIP Code</Label>
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

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Skip for Now
            </Button>
            <Button 
              onClick={handleSaveAddress}
              disabled={loading || !address.street || !address.city}
            >
              {loading ? "Saving..." : "Save Address"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddressCollectionDialog;