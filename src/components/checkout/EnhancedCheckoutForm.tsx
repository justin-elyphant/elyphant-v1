import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MapPin, 
  User, 
  Package, 
  AlertCircle, 
  CheckCircle,
  Truck,
  Gift,
  Edit3,
  Calendar as CalendarIcon
} from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useProfile } from '@/contexts/profile/ProfileContext';
import { unifiedRecipientService, UnifiedRecipient } from '@/services/unifiedRecipientService';
import { usePricingSettings } from '@/hooks/usePricingSettings';
import { toast } from 'sonner';
import CheckoutForm from '../marketplace/checkout/CheckoutForm';
import ModernOrderSummary from './ModernOrderSummary';
import CheckoutProgressIndicator from './CheckoutProgressIndicator';
import StreamlinedDeliveryEditModal from './StreamlinedDeliveryEditModal';
import RecipientAddressDisplay from './RecipientAddressDisplay';
import { DeliveryGroup } from '@/types/recipient';

interface ShippingInfo {
  name: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface EnhancedCheckoutFormProps {
  onCheckoutComplete: (orderData: any) => void;
}

const EnhancedCheckoutForm: React.FC<EnhancedCheckoutFormProps> = ({
  onCheckoutComplete
}) => {
  const { cartItems, deliveryGroups, getUnassignedItems, updateRecipientAssignment } = useCart();
  const { profile } = useProfile();
  const [recipients, setRecipients] = useState<UnifiedRecipient[]>([]);
  const [recipientsLoading, setRecipientsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<'review' | 'shipping' | 'payment'>('review');
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    name: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States'
  });
  const [addressValidationErrors, setAddressValidationErrors] = useState<string[]>([]);
  const [deliveryValidation, setDeliveryValidation] = useState<{
    groupId: string;
    isValid: boolean;
    error?: string;
  }[]>([]);
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [shippingMethod, setShippingMethod] = useState<string>('Standard Shipping');
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<DeliveryGroup | null>(null);

  useEffect(() => {
    fetchRecipients();
  }, []);

  const fetchRecipients = async () => {
    try {
      setRecipientsLoading(true);
      const allRecipients = await unifiedRecipientService.getAllRecipients();
      console.log('🔍 Fetched recipients from unified service:', allRecipients);
      setRecipients(allRecipients);
    } catch (error) {
      console.error('Error fetching recipients:', error);
      toast.error('Failed to load recipients');
    } finally {
      setRecipientsLoading(false);
    }
  };

  useEffect(() => {
    if (profile) {
      setShippingInfo(prev => ({
        ...prev,
        name: profile.name || '',
        email: profile.email || ''
      }));
    }
  }, [profile]);

  useEffect(() => {
    validateDeliveryGroups();
  }, [deliveryGroups, recipients]);

  useEffect(() => {
    // Calculate shipping cost based on addresses and items
    const baseShipping = 9.99;
    const freeShippingThreshold = 75;
    const totalAmount = getTotalAmount();
    
    setShippingCost(totalAmount >= freeShippingThreshold ? 0 : baseShipping);
    setTaxAmount(totalAmount * 0.0825); // 8.25% tax rate
  }, [cartItems]);

  const getRecipientAddress = (connectionId: string) => {
    console.log('🔍 Looking for address for connectionId:', connectionId);
    console.log('🔍 Available recipients:', recipients);
    
    const recipient = recipients.find(r => r.id === connectionId);
    console.log('🔍 Found recipient:', recipient);
    console.log('🔍 Recipient address:', recipient?.address);
    
    return recipient?.address || null;
  };

  const validateDeliveryGroups = () => {
    const validationResults = deliveryGroups.map(group => {
      if (!group.shippingAddress) {
        // Try to get address from recipient
        const recipientAddress = getRecipientAddress(group.connectionId);
        if (!recipientAddress) {
          return {
            groupId: group.id,
            isValid: false,
            error: `No shipping address available for ${group.connectionName}`
          };
        }
      }

      return {
        groupId: group.id,
        isValid: true
      };
    });

    setDeliveryValidation(validationResults);
  };

  const validateAddresses = () => {
    const errors: string[] = [];
    const unassignedItems = getUnassignedItems();

    // Check unassigned items need shipping address
    if (unassignedItems.length > 0 && !shippingInfo.address) {
      errors.push('Please provide a shipping address for your items');
    }

    // Check delivery groups have valid addresses
    const invalidGroups = deliveryValidation.filter(v => !v.isValid);
    if (invalidGroups.length > 0) {
      errors.push('Some recipients need shipping addresses. Please request addresses or update recipient assignments.');
    }

    setAddressValidationErrors(errors);
    return errors.length === 0;
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalAmount = () => {
    return cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const handleUpdateShipping = (data: Partial<ShippingInfo>) => {
    setShippingInfo(prev => ({ ...prev, ...data }));
  };

  const handleEditDeliveryGroup = (group: DeliveryGroup) => {
    setEditingGroup(group);
    setEditModalOpen(true);
  };

  const getRecipientForGroup = (group: DeliveryGroup) => {
    return recipients.find(r => r.id === group.connectionId) || null;
  };

  const handleSaveDeliveryGroup = (updatedGroup: DeliveryGroup) => {
    // Update all items in this delivery group with the new information
    const itemsInGroup = cartItems.filter(item => 
      item.recipientAssignment?.deliveryGroupId === updatedGroup.id
    );

    itemsInGroup.forEach(item => {
      if (item.recipientAssignment) {
        updateRecipientAssignment(item.product.id, {
          giftMessage: updatedGroup.giftMessage,
          scheduledDeliveryDate: updatedGroup.scheduledDeliveryDate,
          shippingAddress: updatedGroup.shippingAddress
        });
      }
    });

    toast.success('Delivery group updated successfully');
    setEditModalOpen(false);
    setEditingGroup(null);
  };

  const handleProceedToPayment = () => {
    if (!validateAddresses()) {
      toast.error('Please resolve address issues before proceeding');
      return;
    }

    setCurrentStep('payment');
  };

  const handleProcessOrder = async () => {
    try {
      // Prepare order data with all delivery information
      const orderData = {
        items: cartItems,
        deliveryGroups: deliveryGroups.map(group => ({
          ...group,
          shippingAddress: group.shippingAddress || getRecipientAddress(group.connectionId)
        })),
        unassignedItemsShipping: getUnassignedItems().length > 0 ? shippingInfo : null,
        totalAmount: getTotalAmount(),
        totalItems: getTotalItems()
      };

      onCheckoutComplete(orderData);
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to process order');
    }
  };

  if (recipientsLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-muted-foreground">Loading checkout...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Package className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Checkout</h1>
          <p className="text-muted-foreground">
            {getTotalItems()} items • ${getTotalAmount().toFixed(2)}
          </p>
        </div>
      </div>

      {/* Progress Indicator */}
      <CheckoutProgressIndicator currentStep={currentStep} />

      {/* Address Validation Errors */}
      {addressValidationErrors.length > 0 && (
        <Alert className="border-destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              {addressValidationErrors.map((error, index) => (
                <div key={index}>{error}</div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-6">
          {/* Delivery Groups */}
          {deliveryGroups.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Gift Deliveries ({deliveryGroups.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {deliveryGroups.map((group) => {
                  console.log('🔍 Processing delivery group:', group);
                  
                  const validation = deliveryValidation.find(v => v.groupId === group.id);
                  const recipientAddress = getRecipientAddress(group.connectionId);
                  const hasAddress = Boolean(group.shippingAddress || recipientAddress);

                  console.log('🔍 Group address status:', {
                    hasGroupAddress: Boolean(group.shippingAddress),
                    hasRecipientAddress: Boolean(recipientAddress),
                    hasAddress
                  });

                  return (
                    <div key={group.id} className="border rounded-lg p-6 space-y-4">
                      {/* Header with recipient info and edit button */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <User className="h-5 w-5" />
                          <div>
                            <div className="font-medium text-lg">{group.connectionName}</div>
                            <div className="text-sm text-muted-foreground">
                              {group.items.length} item(s)
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditDeliveryGroup(group)}
                            className="flex items-center gap-2"
                          >
                            <Edit3 className="h-4 w-4" />
                            Edit
                          </Button>
                          {hasAddress ? (
                            <Badge variant="default" className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Address Ready
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Address Needed
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Prominent Address Display */}
                      {hasAddress && (
                        <div className="bg-background border rounded-lg p-4">
                          <RecipientAddressDisplay 
                            address={group.shippingAddress || recipientAddress}
                            showFullAddress={true}
                          />
                        </div>
                      )}

                      {/* Gift Message */}
                      {group.giftMessage && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <Gift className="h-5 w-5 mt-0.5 text-blue-600" />
                            <div className="flex-1">
                              <div className="font-medium text-blue-900 mb-1">Gift Message</div>
                              <div className="text-sm text-blue-800 leading-relaxed">
                                "{group.giftMessage}"
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Scheduled Delivery */}
                      {group.scheduledDeliveryDate && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <CalendarIcon className="h-5 w-5 mt-0.5 text-green-600" />
                            <div className="flex-1">
                              <div className="font-medium text-green-900 mb-1">Scheduled Delivery</div>
                              <div className="text-sm text-green-800">
                                {new Date(group.scheduledDeliveryDate).toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Address needed alert */}
                      {!hasAddress && (
                        <Alert className="border-destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            This recipient needs a shipping address. Consider requesting their address through the connections center or add it manually using the Edit button.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Unassigned Items Shipping */}
          {getUnassignedItems().length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Your Items ({getUnassignedItems().length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CheckoutForm 
                  shippingInfo={shippingInfo}
                  onUpdate={handleUpdateShipping}
                />
              </CardContent>
            </Card>
          )}

        </div>

        {/* Order Summary */}
        <div className="lg:col-span-4">
          <ModernOrderSummary
            shippingCost={shippingCost}
            taxAmount={taxAmount}
            shippingMethod={shippingMethod}
            estimatedDelivery="3-5 business days"
            currentStep={currentStep}
            isValid={addressValidationErrors.length === 0}
            onProceedToPayment={handleProceedToPayment}
            onCompleteOrder={handleProcessOrder}
          />
        </div>
      </div>

      {/* Enhanced Edit Modal */}
      {editModalOpen && editingGroup && (
        <StreamlinedDeliveryEditModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          deliveryGroup={editingGroup}
          onSave={handleSaveDeliveryGroup}
        />
      )}
    </div>
  );
};

export default EnhancedCheckoutForm;