
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from '@/integrations/stripe/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, Truck, Package, ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/profile/ProfileContext';
import { useToast } from '@/hooks/use-toast';
import { createOrder } from '@/services/orderService';
import { getTransparentPricing } from '@/utils/transparentPricing';
import CheckoutForm from '@/components/marketplace/checkout/CheckoutForm';
import { ShippingInfo } from '@/components/marketplace/checkout/useCheckoutState';
import AddressBookSelector from './components/AddressBookSelector';
import { useDefaultAddress } from '@/hooks/useDefaultAddress';
import SavedPaymentMethodsSection from '@/components/payments/SavedPaymentMethodsSection';

const UnifiedCheckoutForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { cartItems, clearCart } = useCart();
  const { toast } = useToast();
  const { defaultAddress } = useDefaultAddress();

  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [subtotal, setSubtotal] = useState(0);
  const [shippingCost, setShippingCost] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [giftingFee, setGiftingFee] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  
  // Shipping information state with auto-population
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    email: user?.email || '',
    fullName: profile?.name || defaultAddress?.name || '',
    address: defaultAddress?.address_line1 || profile?.shipping_address?.address_line1 || '',
    address2: defaultAddress?.address_line2 || profile?.shipping_address?.address_line2 || '',
    city: defaultAddress?.city || profile?.shipping_address?.city || '',
    state: defaultAddress?.state || profile?.shipping_address?.state || '',
    zipCode: defaultAddress?.zip_code || profile?.shipping_address?.zip_code || '',
    country: defaultAddress?.country || profile?.shipping_address?.country || 'United States',
    phone: profile?.phone || ''
  });

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');

  // Calculate pricing on component mount and when cart changes
  useEffect(() => {
    const calculatePricing = async () => {
      let calculatedSubtotal = 0;
      let calculatedGiftingFee = 0;

      for (const item of cartItems) {
        const itemTotal = item.product.price * item.quantity;
        calculatedSubtotal += itemTotal;
        
        // Get gifting fee for each item
        const pricing = await getTransparentPricing(itemTotal);
        calculatedGiftingFee += pricing.giftingFee;
      }

      const calculatedTaxAmount = calculatedSubtotal * 0.08; // 8% tax
      const calculatedShippingCost = 9.99; // Flat shipping
      const calculatedTotal = calculatedSubtotal + calculatedGiftingFee + calculatedTaxAmount + calculatedShippingCost;

      setSubtotal(calculatedSubtotal);
      setGiftingFee(calculatedGiftingFee);
      setTaxAmount(calculatedTaxAmount);
      setShippingCost(calculatedShippingCost);
      setTotalAmount(calculatedTotal);
    };

    if (cartItems.length > 0) {
      calculatePricing();
    }
  }, [cartItems]);

  const handleUpdateShippingInfo = (data: Partial<ShippingInfo>) => {
    setShippingInfo(prev => ({ ...prev, ...data }));
  };

  const handlePaymentMethodSelect = (paymentMethodId: string) => {
    setSelectedPaymentMethod(paymentMethodId);
  };

  const handlePlaceOrder = async () => {
    if (!selectedPaymentMethod) {
      toast({
        title: "Payment Method Required",
        description: "Please select a payment method to continue.",
        variant: "destructive",
      });
      return;
    }

    // Validate shipping info
    const requiredFields = ['email', 'fullName', 'address', 'city', 'state', 'zipCode'];
    const missingFields = requiredFields.filter(field => !shippingInfo[field as keyof ShippingInfo]);
    
    if (missingFields.length > 0) {
      toast({
        title: "Missing Information",
        description: `Please fill in: ${missingFields.join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create order
      const orderData = {
        cartItems,
        subtotal,
        shippingCost,
        taxAmount,
        totalAmount,
        shippingInfo,
        giftOptions: {
          giftMessage: '',
          isGift: false,
          isSurpriseGift: false,
          scheduledDeliveryDate: ''
        },
        paymentIntentId: selectedPaymentMethod
      };

      const order = await createOrder(orderData);
      
      toast({
        title: "Order Placed Successfully!",
        description: `Order #${order.order_number} has been created.`,
      });

      // Clear cart and navigate to success page
      clearCart();
      navigate(`/order-confirmation/${order.id}`);
      
    } catch (error) {
      console.error('Error placing order:', error);
      toast({
        title: "Order Failed",
        description: error instanceof Error ? error.message : "Failed to place order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-16">
          <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">
            Add some items to your cart before checking out
          </p>
          <Button onClick={() => navigate("/marketplace")}>
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Checkout</h1>
        <p className="text-muted-foreground">Complete your order below</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Forms */}
        <div className="space-y-6">
          {/* Shipping Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Shipping Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <AddressBookSelector onSelectAddress={handleUpdateShippingInfo} />
              <CheckoutForm 
                shippingInfo={shippingInfo} 
                onUpdate={handleUpdateShippingInfo} 
              />
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Elements stripe={stripePromise}>
                <SavedPaymentMethodsSection
                  selectedPaymentMethod={selectedPaymentMethod}
                  onPaymentMethodSelect={handlePaymentMethodSelect}
                  totalAmount={totalAmount}
                />
              </Elements>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Order Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Cart Items */}
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div key={`${item.product.product_id}-${item.recipientAssignment?.connectionId || 'self'}`} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <div className="relative">
                      {item.product.image ? (
                        <img 
                          src={item.product.image} 
                          alt={item.product.name || item.product.title}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <Badge 
                        variant="secondary" 
                        className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                      >
                        {item.quantity}
                      </Badge>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {item.product.name || item.product.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ${item.product.price.toFixed(2)} each
                      </p>
                      {item.recipientAssignment && (
                        <Badge variant="outline" className="text-xs mt-1">
                          Gift for {item.recipientAssignment.connectionName}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="text-sm font-medium">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Pricing Breakdown */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal ({cartItems.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>Gifting Fee</span>
                  <span>${giftingFee.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>${shippingCost.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span>${taxAmount.toFixed(2)}</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <Button 
                onClick={handlePlaceOrder}
                disabled={isLoading || !selectedPaymentMethod}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing Order...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Place Order - ${totalAmount.toFixed(2)}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UnifiedCheckoutForm;
