import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, MapPin, Gift, AlertCircle, CalendarIcon, CheckCircle, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { DeliveryGroup } from '@/types/recipient';
import { UnifiedRecipient, unifiedRecipientService } from '@/services/unifiedRecipientService';
import { toast } from 'sonner';

interface EnhancedDeliveryEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deliveryGroup: DeliveryGroup;
  recipient: UnifiedRecipient | null;
  onSave: (updatedGroup: DeliveryGroup) => void;
}

export interface EditFormData {
  // Basic Info
  name: string;
  email: string;
  
  // Address
  shippingAddress: {
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  } | null;
  
  // Gift Options
  giftMessage: string;
  scheduledDeliveryDate: string;
  specialInstructions: string;
}

const EnhancedDeliveryEditModal: React.FC<EnhancedDeliveryEditModalProps> = ({
  open,
  onOpenChange,
  deliveryGroup,
  recipient,
  onSave
}) => {
  const [formData, setFormData] = useState<EditFormData>({
    name: '',
    email: '',
    shippingAddress: null,
    giftMessage: '',
    scheduledDeliveryDate: '',
    specialInstructions: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  // Removed birthday state
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>();
  const [addressOverride, setAddressOverride] = useState(false);

  // Initialize form data when modal opens
  useEffect(() => {
    if (open && deliveryGroup) {
      loadRecipientData();
    }
  }, [open, deliveryGroup, recipient]);

  const loadRecipientData = async () => {
    try {
      // Get full recipient data
      const fullRecipient = await unifiedRecipientService.getRecipientById(deliveryGroup.connectionId);
      
      const initialData: EditFormData = {
        // Basic Info
        name: fullRecipient?.name || deliveryGroup.connectionName || '',
        email: fullRecipient?.email || '',
        
        // Address
        shippingAddress: deliveryGroup.shippingAddress || (fullRecipient?.address ? {
          name: fullRecipient.address.name || fullRecipient.name || '',
          address: fullRecipient.address.street || fullRecipient.address.address_line1 || fullRecipient.address.address || '',
          city: fullRecipient.address.city || '',
          state: fullRecipient.address.state || '',
          zipCode: fullRecipient.address.zipCode || fullRecipient.address.zip_code || '',
          country: fullRecipient.address.country || 'United States'
        } : null),
        
        // Gift Options
        giftMessage: deliveryGroup.giftMessage || '',
        scheduledDeliveryDate: deliveryGroup.scheduledDeliveryDate || '',
        specialInstructions: ''
      };
      
      setFormData(initialData);
      setScheduledDate(initialData.scheduledDeliveryDate ? new Date(initialData.scheduledDeliveryDate) : undefined);
      setAddressOverride(!!deliveryGroup.shippingAddress);
      setValidationErrors([]);
    } catch (error) {
      console.error('Error loading recipient data:', error);
      toast.error('Failed to load recipient data');
    }
  };

  const getRecipientType = () => {
    if (!recipient) return 'unknown';
    return recipient.source;
  };

  const getEditPermissions = () => {
    const type = getRecipientType();
    return {
      canEditBasicInfo: type === 'pending' || type === 'address_book',
      canEditAddress: true,
      canEditGiftOptions: true
    };
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];
    
    if (!formData.name.trim()) {
      errors.push('Recipient name is required');
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push('Please enter a valid email address');
    }
    
    if (formData.shippingAddress) {
      if (!formData.shippingAddress.address.trim()) {
        errors.push('Street address is required');
      }
      if (!formData.shippingAddress.city.trim()) {
        errors.push('City is required');
      }
      if (!formData.shippingAddress.state.trim()) {
        errors.push('State is required');
      }
      if (!formData.shippingAddress.zipCode.trim()) {
        errors.push('ZIP code is required');
      }
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Please fix the validation errors before saving');
      return;
    }

    setIsLoading(true);
    try {
      // Update recipient information in the backend if it's editable
      const permissions = getEditPermissions();
      if (recipient && permissions.canEditBasicInfo) {
        await unifiedRecipientService.updateRecipient(recipient.id, {
          name: formData.name,
          email: formData.email,
          address: formData.shippingAddress
        });
      }

      // Update the delivery group with new information
      const updatedGroup: DeliveryGroup = {
        ...deliveryGroup,
        connectionName: formData.name,
        giftMessage: formData.giftMessage,
        scheduledDeliveryDate: formData.scheduledDeliveryDate,
        shippingAddress: formData.shippingAddress
      };

      onSave(updatedGroup);
      toast.success('Delivery information updated successfully');
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating delivery group:', error);
      toast.error('Failed to update delivery information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScheduledDateSelect = (date: Date | undefined) => {
    setScheduledDate(date);
    setFormData({
      ...formData,
      scheduledDeliveryDate: date ? date.toISOString() : ''
    });
  };

  const useRecipientAddress = () => {
    if (recipient?.address) {
      const recipientAddr = recipient.address;
      const normalizedAddress = {
        name: recipientAddr.name || recipient.name || formData.name,
        address: recipientAddr.street || recipientAddr.address_line1 || recipientAddr.address || '',
        city: recipientAddr.city || '',
        state: recipientAddr.state || '',
        zipCode: recipientAddr.zipCode || recipientAddr.zip_code || '',
        country: recipientAddr.country || 'United States'
      };
      
      setFormData({ ...formData, shippingAddress: normalizedAddress });
    }
    setAddressOverride(false);
  };

  const createManualAddress = () => {
    const newAddress = {
      name: formData.name,
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States'
    };
    
    setFormData({ ...formData, shippingAddress: newAddress });
    setAddressOverride(true);
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

  const permissions = getEditPermissions();
  const recipientType = getRecipientType();
  const hasRecipientAddress = recipient?.address;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <div className="flex flex-col h-full">
          <DialogHeader className="flex-shrink-0 p-6 pb-0">
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Edit Delivery for {deliveryGroup.connectionName}
              <Badge variant="outline" className="ml-2">
                {recipientType === 'connection' ? 'Connected' : 
                 recipientType === 'pending' ? 'Pending' : 
                 recipientType === 'address_book' ? 'Address Book' : 'Unknown'}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-6 pt-4 space-y-6">
                {/* Validation Errors */}
                {validationErrors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-medium mb-1">Please fix these errors:</div>
                      <ul className="text-sm space-y-1">
                        {validationErrors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Recipient Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Recipient Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          disabled={!permissions.canEditBasicInfo}
                          className={!permissions.canEditBasicInfo ? 'bg-muted' : ''}
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          disabled={!permissions.canEditBasicInfo}
                          className={!permissions.canEditBasicInfo ? 'bg-muted' : ''}
                        />
                      </div>
                    </div>

                  </CardContent>
                </Card>

                {/* Address Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Delivery Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Current Address Display */}
                    {formData.shippingAddress && (
                      <div className="bg-muted/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium">Current Address</span>
                          <Badge variant={addressOverride ? "default" : "secondary"}>
                            {addressOverride ? 'Manual Override' : 'From Profile'}
                          </Badge>
                        </div>
                        <div className="text-sm space-y-1">
                          <div className="font-medium">{formData.shippingAddress.name}</div>
                          <div>{formData.shippingAddress.address}</div>
                          <div>
                            {formData.shippingAddress.city}, {formData.shippingAddress.state} {formData.shippingAddress.zipCode}
                          </div>
                          <div>{formData.shippingAddress.country}</div>
                        </div>
                      </div>
                    )}

                    {/* Address Actions */}
                    <div className="flex gap-2">
                      {hasRecipientAddress && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={addressOverride ? useRecipientAddress : createManualAddress}
                          className="flex items-center gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          {addressOverride ? 'Use Recipient Address' : 'Override Address'}
                        </Button>
                      )}
                      
                      {!hasRecipientAddress && !formData.shippingAddress && (
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
                    </div>

                    {/* Manual Address Form */}
                    {addressOverride && formData.shippingAddress && (
                      <div className="space-y-4 pt-4 border-t">
                        <div>
                          <Label htmlFor="addressName">Full Name</Label>
                          <Input
                            id="addressName"
                            value={formData.shippingAddress.name}
                            onChange={(e) => updateAddress('name', e.target.value)}
                          />
                        </div>

                        <div>
                          <Label htmlFor="addressStreet">Street Address</Label>
                          <Input
                            id="addressStreet"
                            value={formData.shippingAddress.address}
                            onChange={(e) => updateAddress('address', e.target.value)}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="addressCity">City</Label>
                            <Input
                              id="addressCity"
                              value={formData.shippingAddress.city}
                              onChange={(e) => updateAddress('city', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="addressState">State</Label>
                            <Input
                              id="addressState"
                              value={formData.shippingAddress.state}
                              onChange={(e) => updateAddress('state', e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="addressZip">ZIP Code</Label>
                            <Input
                              id="addressZip"
                              value={formData.shippingAddress.zipCode}
                              onChange={(e) => updateAddress('zipCode', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="addressCountry">Country</Label>
                            <Input
                              id="addressCountry"
                              value={formData.shippingAddress.country}
                              onChange={(e) => updateAddress('country', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Delivery Options */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Gift className="h-5 w-5" />
                      Delivery Options
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="giftMessage">Gift Message</Label>
                      <Textarea
                        id="giftMessage"
                        placeholder="Write a heartfelt message for your gift recipient..."
                        value={formData.giftMessage}
                        onChange={(e) => setFormData({ ...formData, giftMessage: e.target.value })}
                        className="min-h-[100px]"
                      />
                    </div>

                    <div>
                      <Label>Scheduled Delivery Date</Label>
                      <div className="flex gap-2 mt-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "flex-1 justify-start text-left font-normal",
                                !scheduledDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {scheduledDate ? format(scheduledDate, "PPP") : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={scheduledDate}
                              onSelect={handleScheduledDateSelect}
                              initialFocus
                              className="pointer-events-auto"
                              disabled={(date) => date < new Date()}
                            />
                          </PopoverContent>
                        </Popover>
                        
                        {scheduledDate && (
                          <Button
                            variant="outline"
                            onClick={() => handleScheduledDateSelect(undefined)}
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                      {!scheduledDate && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Leave empty for standard delivery timing
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="specialInstructions">Special Instructions</Label>
                      <Textarea
                        id="specialInstructions"
                        placeholder="Any special delivery instructions (e.g., gate code, preferred delivery time, etc.)"
                        value={formData.specialInstructions}
                        onChange={(e) => setFormData({ ...formData, specialInstructions: e.target.value })}
                        className="min-h-[80px]"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </div>

          <DialogFooter className="flex-shrink-0 p-6 pt-0">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={isLoading || validationErrors.length > 0}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedDeliveryEditModal;