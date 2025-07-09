import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Truck, AlertTriangle, User } from 'lucide-react';
import { useProfile } from '@/contexts/profile/ProfileContext';
import { useNavigate } from 'react-router-dom';
import AddressValidation from '@/components/checkout/AddressValidation';

const ShippingPreview: React.FC = () => {
  const { profile } = useProfile();
  const navigate = useNavigate();

  const shippingAddress = profile?.shipping_address;
  const hasCompleteAddress = shippingAddress && 
    profile?.name &&
    (shippingAddress.address_line1 || shippingAddress.street) &&
    shippingAddress.city &&
    shippingAddress.state &&
    (shippingAddress.zip_code || shippingAddress.zipCode);

  const handleEditAddress = () => {
    navigate('/settings', { state: { tab: 'profile' } });
  };

  if (!shippingAddress || !hasCompleteAddress) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4" />
            Shipping Address
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="text-yellow-800 font-medium">
                  No shipping address on file
                </p>
                <p className="text-yellow-700 text-sm">
                  Add your shipping address to proceed with checkout
                </p>
                <Button 
                  onClick={handleEditAddress}
                  size="sm"
                  className="mt-2"
                >
                  Add Shipping Address
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Shipping Address
          </div>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Truck className="h-3 w-3 mr-1" />
            Ready
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">{profile?.name}</p>
              <p className="text-sm text-muted-foreground">
                {shippingAddress.address_line1 || shippingAddress.street}
              </p>
              {(shippingAddress.address_line2) && (
                <p className="text-sm text-muted-foreground">
                  {shippingAddress.address_line2}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zip_code || shippingAddress.zipCode}
              </p>
              {shippingAddress.country && shippingAddress.country !== 'US' && (
                <p className="text-sm text-muted-foreground">
                  {shippingAddress.country}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">
            This address will be used for all items
          </span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleEditAddress}
          >
            Edit
          </Button>
        </div>

        {/* Address Validation */}
        <AddressValidation 
          address={{
            name: profile?.name || '',
            address: shippingAddress.address_line1 || shippingAddress.street || '',
            line2: shippingAddress.address_line2 || '',
            city: shippingAddress.city || '',
            state: shippingAddress.state || '',
            zipCode: shippingAddress.zip_code || shippingAddress.zipCode || '',
            country: shippingAddress.country || 'US'
          }}
        />
      </CardContent>
    </Card>
  );
};

export default ShippingPreview;