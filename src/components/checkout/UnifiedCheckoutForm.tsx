import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Truck, Package, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/auth';
import CheckoutForm from '@/components/marketplace/checkout/CheckoutForm';
import PaymentMethodForm from '@/components/checkout/PaymentMethodForm';
import CheckoutOrderSummary from '@/components/checkout/CheckoutOrderSummary';
import { useCheckoutState, ShippingInfo } from '@/components/marketplace/checkout/useCheckoutState';
import { createOrder } from '@/services/orderService';

const UnifiedCheckoutForm = () => {
  const navigate = useNavigate();
  const { cartItems, clearCart } = useCart();
  const { user } = useAuth();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card');
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    activeTab,
    checkoutData,
    handleTabChange,
    handleUpdateShippingInfo,
    handlePaymentMethodChange,
    canPlaceOrder,
    getShippingCost
  } = useCheckoutState();

  // Calculate totals using the centralized shipping cost function
  const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const calculatedShippingCost = getShippingCost();
  const taxAmount = subtotal * 0.08875; // NY tax rate
  const totalAmount = subtotal + calculatedShippingCost + taxAmount;

  // Redirect if cart is empty
  useEffect(() => {
    if (cartItems.length === 0) {
      navigate("/cart");
    }
  }, [cartItems.length, navigate]);

  // Ensure user is authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handlePlaceOrder = async () => {
    if (!selectedPaymentMethod) {
      toast.error("Please select a payment method to continue.");
      return;
    }

    const requiredFields = ['name', 'email', 'address', 'city', 'state', 'zipCode'];
    const missingFields = requiredFields.filter(field => !checkoutData.shippingInfo[field as keyof ShippingInfo]);
    
    if (missingFields.length > 0) {
      toast.error(`Please fill in: ${missingFields.join(', ')}`);
      return;
    }

    setIsLoading(true);
    
    try {
      const orderData = {
        user_id: user?.id,
        items: cartItems.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
          name: item.product.name
        })),
        shipping_info: checkoutData.shippingInfo,
        shipping_method: checkoutData.shippingMethod,
        payment_method: selectedPaymentMethod,
        subtotal,
        shipping_cost: calculatedShippingCost,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        status: 'pending'
      };

      const order = await createOrder(orderData);
      
      toast.success(`Order #${order.order_number} has been created.`);

      // Clear cart and navigate to success page
      clearCart();
      navigate('/order-confirmation', { state: { orderId: order.id } });
      
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error(error instanceof Error ? error.message : "Failed to place order. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main checkout form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Checkout</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="shipping" className="flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Shipping
                  </TabsTrigger>
                  <TabsTrigger value="payment" className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Payment
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="shipping" className="space-y-6">
                  <CheckoutForm 
                    shippingInfo={checkoutData.shippingInfo}
                    onUpdate={handleUpdateShippingInfo}
                  />
                  
                  <div className="flex justify-end">
                    <Button 
                      onClick={() => handleTabChange('payment')}
                      className="flex items-center gap-2"
                    >
                      Continue to Payment
                      <CreditCard className="h-4 w-4" />
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="payment" className="space-y-6">
                  <PaymentMethodForm
                    selectedMethod={selectedPaymentMethod}
                    onMethodChange={setSelectedPaymentMethod}
                  />
                  
                  <div className="flex justify-between">
                    <Button 
                      variant="outline"
                      onClick={() => handleTabChange('shipping')}
                      className="flex items-center gap-2"
                    >
                      <Truck className="h-4 w-4" />
                      Back to Shipping
                    </Button>
                    
                    <Button 
                      onClick={handlePlaceOrder}
                      disabled={!canPlaceOrder() || isLoading}
                      className="flex items-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                          Placing Order...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          Place Order
                        </>
                      )}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Order summary */}
        <div>
          <CheckoutOrderSummary
            items={cartItems}
            subtotal={subtotal}
            shippingCost={calculatedShippingCost}
            giftingFee={0}
            taxAmount={taxAmount}
            totalAmount={totalAmount}
          />
        </div>
      </div>
    </div>
  );
};

export default UnifiedCheckoutForm;
