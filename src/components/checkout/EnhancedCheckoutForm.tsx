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
  Gift
} from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useConnectionAddresses } from '@/hooks/checkout/useConnectionAddresses';
import { useProfile } from '@/contexts/profile/ProfileContext';
import { toast } from 'sonner';
import AddressBookSelector from './AddressBookSelector';
import CheckoutForm from '../marketplace/checkout/CheckoutForm';

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
  const { cartItems, deliveryGroups, getUnassignedItems } = useCart();
  const { connections, loading: connectionsLoading, hasValidAddress, getConnectionAddress } = useConnectionAddresses();
  const { profile } = useProfile();
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
  }, [deliveryGroups, connections]);

  const validateDeliveryGroups = () => {
    const validationResults = deliveryGroups.map(group => {
      if (!group.shippingAddress) {
        // Try to get address from connection
        const connectionAddress = getConnectionAddress(group.connectionId);
        if (!connectionAddress) {
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
          shippingAddress: group.shippingAddress || getConnectionAddress(group.connectionId)
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

  if (connectionsLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-muted-foreground">Loading checkout...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Package className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Checkout</h1>
          <p className="text-muted-foreground">
            {getTotalItems()} items • ${getTotalAmount().toFixed(2)}
          </p>
        </div>
      </div>

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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
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
                  const validation = deliveryValidation.find(v => v.groupId === group.id);
                  const connectionAddress = getConnectionAddress(group.connectionId);
                  const hasAddress = Boolean(group.shippingAddress || connectionAddress);

                  return (
                    <div key={group.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <User className="h-5 w-5" />
                          <div>
                            <div className="font-medium">{group.connectionName}</div>
                            <div className="text-sm text-muted-foreground">
                              {group.items.length} item(s)
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
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

                      {hasAddress && (
                        <div className="flex items-start gap-2 mt-2 p-3 bg-muted/30 rounded">
                          <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                          <div className="text-sm">
                            {group.shippingAddress ? (
                              <div>
                                {group.shippingAddress.name}<br />
                                {group.shippingAddress.address}<br />
                                {group.shippingAddress.city}, {group.shippingAddress.state} {group.shippingAddress.zipCode}
                              </div>
                            ) : connectionAddress ? (
                              <div>
                                {connectionAddress.name}<br />
                                {connectionAddress.address}<br />
                                {connectionAddress.city}, {connectionAddress.state} {connectionAddress.zipCode}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      )}

                      {group.giftMessage && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                          <div className="text-sm font-medium text-blue-900">Gift Message:</div>
                          <div className="text-sm text-blue-800 mt-1">{group.giftMessage}</div>
                        </div>
                      )}

                      {!hasAddress && (
                        <Alert className="mt-3">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            This recipient needs a shipping address. Consider requesting their address through the connections center.
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

          {/* Address Book for User Items */}
          {getUnassignedItems().length > 0 && (
            <AddressBookSelector
              onAddressSelect={(address) => {
                handleUpdateShipping({
                  name: address.name,
                  address: address.address.street,
                  city: address.address.city,
                  state: address.address.state,
                  zipCode: address.address.zipCode,
                  country: address.address.country
                });
              }}
              title="Use Saved Address"
            />
          )}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${getTotalAmount().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>${getTotalAmount().toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Button 
                  onClick={handleProceedToPayment}
                  className="w-full"
                  disabled={addressValidationErrors.length > 0}
                >
                  Proceed to Payment
                </Button>
                {currentStep === 'payment' && (
                  <Button 
                    onClick={handleProcessOrder}
                    className="w-full"
                    variant="default"
                  >
                    Complete Order
                  </Button>
                )}
              </div>

              <div className="text-xs text-muted-foreground">
                By placing this order, you agree to our Terms of Service and Privacy Policy.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EnhancedCheckoutForm;