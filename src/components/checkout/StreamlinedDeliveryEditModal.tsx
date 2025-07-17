import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useConnectionAddresses } from '@/hooks/checkout/useConnectionAddresses';
import AddressDisplay from './components/AddressDisplay';
import AddressForm from './components/AddressForm';
import GiftOptionsForm from './components/GiftOptionsForm';

interface DeliveryGroup {
  id: string;
  connectionId?: string;
  connectionName: string;
  items: any[];
  shippingAddress?: any;
  giftMessage?: string;
  scheduledDeliveryDate?: string;
  specialInstructions?: string;
}

interface StreamlinedDeliveryEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  deliveryGroup: DeliveryGroup;
  onSave: (updatedGroup: DeliveryGroup) => void;
}

const StreamlinedDeliveryEditModal: React.FC<StreamlinedDeliveryEditModalProps> = ({
  isOpen,
  onClose,
  deliveryGroup,
  onSave,
}) => {
  const { getConnectionAddress, refreshConnection } = useConnectionAddresses();
  
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [addressOverride, setAddressOverride] = useState(false);
  const [overrideAddress, setOverrideAddress] = useState<any>(null);
  const [giftOptions, setGiftOptions] = useState({
    giftMessage: '',
    scheduledDeliveryDate: '',
    specialInstructions: ''
  });
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [isValidAddress, setIsValidAddress] = useState(true);

  // Get connection data
  const connectionAddress = deliveryGroup.connectionId 
    ? getConnectionAddress(deliveryGroup.connectionId)
    : null;

  useEffect(() => {
    if (isOpen) {
      // Initialize form from delivery group and connection data
      setName(connectionAddress?.name || deliveryGroup.connectionName || '');
      setEmail(connectionAddress?.email || '');
      
      // Check if there's an address override
      const hasOverride = !!deliveryGroup.shippingAddress;
      setAddressOverride(hasOverride);
      setOverrideAddress(deliveryGroup.shippingAddress || null);
      
      // Initialize gift options
      setGiftOptions({
        giftMessage: deliveryGroup.giftMessage || '',
        scheduledDeliveryDate: deliveryGroup.scheduledDeliveryDate || '',
        specialInstructions: deliveryGroup.specialInstructions || ''
      });
      
      setScheduledDate(
        deliveryGroup.scheduledDeliveryDate 
          ? new Date(deliveryGroup.scheduledDeliveryDate) 
          : undefined
      );
    }
  }, [isOpen, deliveryGroup, connectionAddress]);

  const handleSave = async () => {
    if (addressOverride && !isValidAddress) {
      toast.error('Please fix address validation errors');
      return;
    }

    setIsLoading(true);
    try {
      // Prepare updated delivery group
      const updatedGroup: DeliveryGroup = {
        ...deliveryGroup,
        connectionName: name,
        shippingAddress: addressOverride ? overrideAddress : null,
        giftMessage: giftOptions.giftMessage,
        scheduledDeliveryDate: giftOptions.scheduledDeliveryDate,
        specialInstructions: giftOptions.specialInstructions,
      };

      // If we have a connection ID and basic info changed, update the connection
      if (deliveryGroup.connectionId && connectionAddress) {
        // Note: In a full implementation, you might want to update the connection
        // via the useConnectionAddresses hook or a dedicated update function
        console.log('Connection info updated:', { name, email });
      }

      onSave(updatedGroup);
      toast.success('Delivery information updated');
      onClose();
    } catch (error) {
      console.error('Failed to save delivery info:', error);
      toast.error('Failed to save delivery information');
    } finally {
      setIsLoading(false);
    }
  };

  const displayAddress = addressOverride 
    ? overrideAddress 
    : connectionAddress;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Delivery Information</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Connection Info Section */}
          <Card>
            <CardHeader>
              <CardTitle>Recipient Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address Section */}
          <Card>
            <CardHeader>
              <CardTitle>Shipping Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {connectionAddress && (
                <div className="flex items-center space-x-2">
                  <Switch
                    id="address-override"
                    checked={addressOverride}
                    onCheckedChange={setAddressOverride}
                  />
                  <Label htmlFor="address-override">
                    Use different address
                  </Label>
                </div>
              )}

              {!addressOverride && displayAddress ? (
                <AddressDisplay
                  address={displayAddress}
                  source="profile"
                />
              ) : (
                <AddressForm
                  address={overrideAddress}
                  onChange={setOverrideAddress}
                  onValidate={setIsValidAddress}
                />
              )}
            </CardContent>
          </Card>

          {/* Gift Options Section */}
          <GiftOptionsForm
            giftOptions={giftOptions}
            onChange={setGiftOptions}
            scheduledDate={scheduledDate}
            onScheduledDateChange={setScheduledDate}
          />

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isLoading || (addressOverride && !isValidAddress)}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StreamlinedDeliveryEditModal;