import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, User, AlertCircle, CheckCircle, Edit, Trash2 } from 'lucide-react';
import { EditFormData } from '../EnhancedDeliveryEditModal';
import { UnifiedRecipient } from '@/services/unifiedRecipientService';

interface DeliveryAddressTabProps {
  formData: EditFormData;
  setFormData: (data: EditFormData) => void;
  recipient: UnifiedRecipient | null;
  permissions: {
    canEditBasicInfo: boolean;
    canEditRelationship: boolean;
    canEditAddress: boolean;
    canEditGiftOptions: boolean;
  };
}

const DeliveryAddressTab: React.FC<DeliveryAddressTabProps> = ({
  formData,
  setFormData,
  recipient,
  permissions
}) => {
  const [addressMode, setAddressMode] = React.useState<'profile' | 'manual'>(() => {
    // Determine initial mode based on whether there's a manual address
    if (formData.shippingAddress) {
      return 'manual';
    }
    return 'profile';
  });

  const hasRecipientAddress = recipient?.address;
  const hasManualAddress = formData.shippingAddress;

  const createManualAddress = () => {
    const newAddress = {
      name: formData.name,
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States'
    };
    
    setFormData({
      ...formData,
      shippingAddress: newAddress
    });
    setAddressMode('manual');
  };

  const useRecipientAddress = () => {
    if (hasRecipientAddress) {
      const recipientAddr = recipient.address;
      const normalizedAddress = {
        name: recipientAddr.name || recipient.name || formData.name,
        address: recipientAddr.street || recipientAddr.address_line1 || recipientAddr.address || '',
        city: recipientAddr.city || '',
        state: recipientAddr.state || '',
        zipCode: recipientAddr.zipCode || recipientAddr.zip_code || '',
        country: recipientAddr.country || 'United States'
      };
      
      setFormData({
        ...formData,
        shippingAddress: normalizedAddress
      });
    }
    setAddressMode('profile');
  };

  const clearManualAddress = () => {
    setFormData({
      ...formData,
      shippingAddress: null
    });
    setAddressMode('profile');
  };

  const updateAddress = (field: string, value: string) => {
    if (formData.shippingAddress) {
      setFormData({
        ...formData,
        shippingAddress: {
          ...formData.shippingAddress,
          [field]: value
        }
      });
    }
  };

  const getAddressSource = () => {
    if (hasManualAddress) {
      return 'Manual Override';
    }
    if (hasRecipientAddress) {
      return 'Recipient Profile';
    }
    return 'No Address';
  };

  const getAddressDisplay = () => {
    if (hasManualAddress) {
      return formData.shippingAddress;
    }
    if (hasRecipientAddress) {
      const addr = recipient.address;
      return {
        name: addr.name || recipient.name || '',
        address: addr.street || addr.address_line1 || addr.address || '',
        city: addr.city || '',
        state: addr.state || '',
        zipCode: addr.zipCode || addr.zip_code || '',
        country: addr.country || 'United States'
      };
    }
    return null;
  };

  const displayAddress = getAddressDisplay();

  return (
    <div className="space-y-6">
      {/* Address Source Status */}
      <div className="flex items-center gap-2">
        <MapPin className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Delivery Address</h3>
        <Badge variant={hasManualAddress ? "default" : hasRecipientAddress ? "secondary" : "destructive"}>
          {getAddressSource()}
        </Badge>
      </div>

      {/* Current Address Display */}
      {displayAddress ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Current Address
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1 text-sm">
              <div className="font-medium">{displayAddress.name}</div>
              <div>{displayAddress.address}</div>
              <div>
                {displayAddress.city}, {displayAddress.state} {displayAddress.zipCode}
              </div>
              <div>{displayAddress.country}</div>
            </div>
            
            <div className="flex gap-2 mt-3">
              {hasRecipientAddress && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={hasManualAddress ? useRecipientAddress : createManualAddress}
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  {hasManualAddress ? 'Use Recipient Address' : 'Override Address'}
                </Button>
              )}
              
              {!hasRecipientAddress && !hasManualAddress && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={createManualAddress}
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Add Manual Address
                </Button>
              )}
              
              {hasManualAddress && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearManualAddress}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear Override
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Alert className="border-destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No shipping address available. Please add a manual address to complete the order.
            <Button
              variant="outline"
              size="sm"
              className="ml-2"
              onClick={createManualAddress}
            >
              Add Address
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Manual Address Form */}
      {hasManualAddress && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Edit Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="addressName">Full Name</Label>
              <Input
                id="addressName"
                value={formData.shippingAddress?.name || ''}
                onChange={(e) => updateAddress('name', e.target.value)}
                disabled={!permissions.canEditAddress}
              />
            </div>

            <div>
              <Label htmlFor="addressStreet">Street Address</Label>
              <Input
                id="addressStreet"
                value={formData.shippingAddress?.address || ''}
                onChange={(e) => updateAddress('address', e.target.value)}
                disabled={!permissions.canEditAddress}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="addressCity">City</Label>
                <Input
                  id="addressCity"
                  value={formData.shippingAddress?.city || ''}
                  onChange={(e) => updateAddress('city', e.target.value)}
                  disabled={!permissions.canEditAddress}
                />
              </div>
              <div>
                <Label htmlFor="addressState">State</Label>
                <Input
                  id="addressState"
                  value={formData.shippingAddress?.state || ''}
                  onChange={(e) => updateAddress('state', e.target.value)}
                  disabled={!permissions.canEditAddress}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="addressZip">ZIP Code</Label>
                <Input
                  id="addressZip"
                  value={formData.shippingAddress?.zipCode || ''}
                  onChange={(e) => updateAddress('zipCode', e.target.value)}
                  disabled={!permissions.canEditAddress}
                />
              </div>
              <div>
                <Label htmlFor="addressCountry">Country</Label>
                <Input
                  id="addressCountry"
                  value={formData.shippingAddress?.country || ''}
                  onChange={(e) => updateAddress('country', e.target.value)}
                  disabled={!permissions.canEditAddress}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Address Management Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Address Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-2">
            {hasRecipientAddress && (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Recipient has a profile address available</span>
              </div>
            )}
            {hasManualAddress && (
              <div className="flex items-center gap-2">
                <Edit className="h-4 w-4 text-blue-600" />
                <span>Using manual address override</span>
              </div>
            )}
            {!hasRecipientAddress && !hasManualAddress && (
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span>No address available - manual entry required</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeliveryAddressTab;