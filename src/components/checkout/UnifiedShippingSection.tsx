
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { MapPin, Check, Truck, Zap, Crown, Loader2, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ShippingOption } from '@/components/marketplace/zinc/services/shippingQuoteService';
import { ShippingInfo } from '@/components/marketplace/checkout/useCheckoutState';
import AddressBookSelector from '@/components/checkout/components/AddressBookSelector';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/auth';
import { addressService } from '@/services/addressService';
import { FormAddress } from '@/utils/addressStandardization';

interface UnifiedShippingSectionProps {
  shippingInfo: ShippingInfo;
  onUpdateShippingInfo: (data: Partial<ShippingInfo>) => void;
  selectedShippingMethod: string;
  onShippingMethodChange: (method: string) => void;
  shippingOptions: ShippingOption[];
  isLoadingShipping: boolean;
  onSaveAddress?: (name: string, setAsDefault: boolean) => Promise<boolean>;
}

const UnifiedShippingSection: React.FC<UnifiedShippingSectionProps> = ({
  shippingInfo,
  onUpdateShippingInfo,
  selectedShippingMethod,
  onShippingMethodChange,
  shippingOptions,
  isLoadingShipping,
  onSaveAddress
}) => {
  const { user } = useAuth();
  const [showAddressBook, setShowAddressBook] = useState(false);
  const [saveAsDefault, setSaveAsDefault] = useState(false);

  const handleInputChange = (field: keyof ShippingInfo, value: string) => {
    onUpdateShippingInfo({ [field]: value });
  };

  const handleAddressSelect = async (selectedAddress: any) => {
    const formAddress: FormAddress = {
      street: selectedAddress.address.street || selectedAddress.address.address_line1 || '',
      city: selectedAddress.address.city || '',
      state: selectedAddress.address.state || '',
      zipCode: selectedAddress.address.zipCode || selectedAddress.address.zip_code || '',
      country: selectedAddress.address.country || 'United States'
    };

    onUpdateShippingInfo({
      address: formAddress.street,
      city: formAddress.city,
      state: formAddress.state,
      zipCode: formAddress.zipCode,
      country: formAddress.country
    });

    setShowAddressBook(false);
  };

  const handleSaveCurrentAddress = async () => {
    if (onSaveAddress) {
      const success = await onSaveAddress('Checkout Address', saveAsDefault);
      if (success) {
        setSaveAsDefault(false);
      }
    }
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Shipping Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Address Book Button */}
        {user && (
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddressBook(true)}
              className="flex items-center gap-2"
            >
              <BookOpen className="h-4 w-4" />
              Choose from Address Book
            </Button>
          </div>
        )}

        {/* Shipping Form */}
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={shippingInfo.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Your full name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={shippingInfo.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Street Address *</Label>
            <Input
              id="address"
              value={shippingInfo.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="123 Main Street"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="addressLine2">Apartment, suite, etc. (optional)</Label>
            <Input
              id="addressLine2"
              value={shippingInfo.addressLine2}
              onChange={(e) => handleInputChange('addressLine2', e.target.value)}
              placeholder="Apt 4B"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={shippingInfo.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="City"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                value={shippingInfo.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                placeholder="State"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zipCode">ZIP Code *</Label>
              <Input
                id="zipCode"
                value={shippingInfo.zipCode}
                onChange={(e) => handleInputChange('zipCode', e.target.value)}
                placeholder="12345"
                required
              />
            </div>
          </div>

          {/* Save Address Option */}
          {user && onSaveAddress && (
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="saveDefault"
                  checked={saveAsDefault}
                  onChange={(e) => setSaveAsDefault(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="saveDefault" className="text-sm">
                  Save as default address
                </Label>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveCurrentAddress}
                disabled={!shippingInfo.address || !shippingInfo.city}
              >
                Save Address
              </Button>
            </div>
          )}
        </div>

        <Separator />

        {/* Shipping Options */}
        <div>
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

        {/* Address Book Dialog */}
        <Dialog open={showAddressBook} onOpenChange={setShowAddressBook}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Choose from Address Book</DialogTitle>
            </DialogHeader>
            <AddressBookSelector
              onSelect={handleAddressSelect}
              onClose={() => setShowAddressBook(false)}
            />
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default UnifiedShippingSection;
