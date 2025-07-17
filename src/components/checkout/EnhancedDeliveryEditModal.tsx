import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { User, MapPin, Gift, AlertCircle } from 'lucide-react';
import { DeliveryGroup } from '@/types/recipient';
import { UnifiedRecipient, unifiedRecipientService } from '@/services/unifiedRecipientService';
import { toast } from 'sonner';
import RecipientInfoTab from './tabs/RecipientInfoTab';
import DeliveryAddressTab from './tabs/DeliveryAddressTab';
import GiftOptionsTab from './tabs/GiftOptionsTab';

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
  phone: string;
  birthday: string | null;
  
  // Relationship Context
  relationshipType: string;
  closenessLevel: number;
  interactionFrequency: string;
  sharedInterests: string[];
  specialConsiderations: string;
  
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
  isGiftWrapped: boolean;
  surpriseGift: boolean;
  specialInstructions: string;
}

const EnhancedDeliveryEditModal: React.FC<EnhancedDeliveryEditModalProps> = ({
  open,
  onOpenChange,
  deliveryGroup,
  recipient,
  onSave
}) => {
  const [activeTab, setActiveTab] = useState('recipient');
  const [formData, setFormData] = useState<EditFormData>({
    name: '',
    email: '',
    phone: '',
    birthday: null,
    relationshipType: 'friend',
    closenessLevel: 5,
    interactionFrequency: 'regular',
    sharedInterests: [],
    specialConsiderations: '',
    shippingAddress: null,
    giftMessage: '',
    scheduledDeliveryDate: '',
    isGiftWrapped: false,
    surpriseGift: false,
    specialInstructions: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [recipientData, setRecipientData] = useState<any>(null);

  // Initialize form data when modal opens
  useEffect(() => {
    if (open && deliveryGroup) {
      loadRecipientData();
    }
  }, [open, deliveryGroup, recipient]);

  const loadRecipientData = async () => {
    try {
      // Get full recipient data including birthday and relationship context
      const fullRecipient = await unifiedRecipientService.getRecipientById(deliveryGroup.connectionId);
      setRecipientData(fullRecipient);
      
      const initialData: EditFormData = {
        // Basic Info - from recipient if available, otherwise empty
        name: fullRecipient?.name || deliveryGroup.connectionName || '',
        email: fullRecipient?.email || '',
        phone: fullRecipient?.phone || '',
        birthday: fullRecipient?.birthday || null,
        
        // Relationship Context - load from recipient data
        relationshipType: fullRecipient?.relationship_type || 'friend',
        closenessLevel: fullRecipient?.relationship_context?.closeness_level || 5,
        interactionFrequency: fullRecipient?.relationship_context?.interaction_frequency || 'regular',
        sharedInterests: fullRecipient?.relationship_context?.shared_interests || [],
        specialConsiderations: fullRecipient?.relationship_context?.special_considerations || '',
        
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
        isGiftWrapped: false,
        surpriseGift: false,
        specialInstructions: ''
      };
      
      setFormData(initialData);
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
      canEditRelationship: type === 'pending' || type === 'address_book',
      canEditAddress: true, // Can always edit/override address
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
      if (recipient && permissions.canEditBasicInfo) {
        await unifiedRecipientService.updateRecipient(recipient.id, {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          birthday: formData.birthday,
          address: formData.shippingAddress,
          relationship_type: formData.relationshipType,
          relationship_context: {
            closeness_level: formData.closenessLevel,
            interaction_frequency: formData.interactionFrequency,
            shared_interests: formData.sharedInterests,
            special_considerations: formData.specialConsiderations
          }
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

  const permissions = getEditPermissions();
  const recipientType = getRecipientType();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
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

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4 flex-shrink-0">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <div className="font-medium text-destructive mb-1">Please fix these errors:</div>
                <ul className="text-sm text-destructive space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
            <TabsTrigger value="recipient" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Recipient Info
            </TabsTrigger>
            <TabsTrigger value="address" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Delivery Address
            </TabsTrigger>
            <TabsTrigger value="gift" className="flex items-center gap-2">
              <Gift className="h-4 w-4" />
              Gift Options
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden mt-4">
            <TabsContent value="recipient" className="h-full m-0">
              <div className="h-full overflow-y-auto pr-2">
                <RecipientInfoTab
                  formData={formData}
                  setFormData={setFormData}
                  permissions={permissions}
                  recipientType={recipientType}
                />
              </div>
            </TabsContent>

            <TabsContent value="address" className="h-full m-0">
              <div className="h-full overflow-y-auto pr-2">
                <DeliveryAddressTab
                  formData={formData}
                  setFormData={setFormData}
                  recipient={recipient}
                  permissions={permissions}
                />
              </div>
            </TabsContent>

            <TabsContent value="gift" className="h-full m-0">
              <div className="h-full overflow-y-auto pr-2">
                <GiftOptionsTab
                  formData={formData}
                  setFormData={setFormData}
                  permissions={permissions}
                />
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="flex-shrink-0">
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
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedDeliveryEditModal;