import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { MapPin, User, CreditCard, Gift, ArrowRight, ShoppingBag, Clock, Loader2 } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useProfile } from '@/contexts/profile/ProfileContext';
import { getShippingQuote, ShippingOption } from '@/components/marketplace/zinc/services/shippingQuoteService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import AddressBookSelector from './AddressBookSelector';
import ConnectionAddressManager from './ConnectionAddressManager';

interface MobileCheckoutData {
  address: any;
  recipients: any[];
  shippingOption: ShippingOption | null;
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  totalAmount: number;
  isGift: boolean;
  giftMessage?: string;
}

interface MobileOptimizedCheckoutProps {
  onComplete: (checkoutData: MobileCheckoutData) => void;
}

const MobileOptimizedCheckout: React.FC<MobileOptimizedCheckoutProps> = ({
  onComplete
}) => {
  const { cartItems, cartTotal } = useCart();
  const { profile } = useProfile();
  const [currentStep, setCurrentStep] = useState<'address' | 'recipients' | 'payment'>('address');
  const [checkoutData, setCheckoutData] = useState<Partial<MobileCheckoutData>>({});
  const [showAddressSheet, setShowAddressSheet] = useState(false);
  const [showRecipientsSheet, setShowRecipientsSheet] = useState(false);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [isLoadingShipping, setIsLoadingShipping] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const steps = [
    { id: 'address', title: 'Address', icon: MapPin, completed: Boolean(checkoutData.address) },
    { id: 'recipients', title: 'Recipients', icon: User, completed: Boolean(checkoutData.recipients) },
    { id: 'payment', title: 'Payment', icon: CreditCard, completed: false }
  ];

  // Fetch shipping quotes when address is selected
  useEffect(() => {
    const fetchShippingQuotes = async () => {
      if (!checkoutData.address || cartItems.length === 0) return;
      
      setIsLoadingShipping(true);
      try {
        const addressData = checkoutData.address.address;
        const quoteRequest = {
          retailer: "amazon",
          products: cartItems.map(item => ({
            product_id: item.product.product_id,
            quantity: item.quantity
          })),
          shipping_address: {
            first_name: checkoutData.address.name.split(' ')[0] || '',
            last_name: checkoutData.address.name.split(' ').slice(1).join(' ') || checkoutData.address.name,
            address_line1: addressData.street,
            zip_code: addressData.zipCode,
            city: addressData.city,
            state: addressData.state,
            country: addressData.country || 'US'
          }
        };

        const shippingQuote = await getShippingQuote(quoteRequest);
        
        if (shippingQuote?.shipping_options) {
          setShippingOptions(shippingQuote.shipping_options);
          const defaultOption = shippingQuote.shipping_options.find(opt => 
            opt.id.includes('prime') || opt.price === 0
          ) || shippingQuote.shipping_options[0];
          
          setCheckoutData(prev => ({ 
            ...prev, 
            shippingOption: defaultOption,
            shippingCost: defaultOption.price,
            subtotal: cartTotal,
            taxAmount: cartTotal * 0.08, // 8% tax estimate
            totalAmount: cartTotal + defaultOption.price + (cartTotal * 0.08)
          }));
        }
      } catch (error) {
        console.error('Failed to fetch shipping quotes:', error);
        toast.error('Failed to calculate shipping. Please try again.');
      } finally {
        setIsLoadingShipping(false);
      }
    };

    fetchShippingQuotes();
  }, [checkoutData.address, cartItems, cartTotal]);

  const handleAddressSelect = (address: any) => {
    setCheckoutData(prev => ({ ...prev, address }));
    setShowAddressSheet(false);
    if (currentStep === 'address') {
      setCurrentStep('recipients');
    }
  };

  const handleRecipientSelect = (recipient: any) => {
    const isGift = recipient.type !== 'self';
    setCheckoutData(prev => ({ 
      ...prev, 
      recipients: [recipient],
      isGift,
      giftMessage: isGift ? '' : undefined
    }));
    setShowRecipientsSheet(false);
    if (currentStep === 'recipients') {
      setCurrentStep('payment');
    }
  };

  const handleExpressCheckout = (type: 'self' | 'gift') => {
    if (type === 'self' && profile?.shipping_address) {
      const addressData = {
        name: 'My Address',
        address: profile.shipping_address
      };
      setCheckoutData(prev => ({ 
        ...prev, 
        address: addressData,
        recipients: [{ name: profile.name, type: 'self' }],
        isGift: false
      }));
      setCurrentStep('payment');
    } else {
      setCurrentStep('address');
    }
  };

  const handleCompleteOrder = async () => {
    if (!checkoutData.address || !checkoutData.recipients || !checkoutData.shippingOption) {
      toast.error('Please complete all required fields');
      return;
    }

    setIsProcessing(true);
    try {
      // Create payment session
      const { data: session, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          items: cartItems.map(item => ({
            product_id: item.product.product_id,
            name: item.product.name,
            price: item.product.price,
            quantity: item.quantity,
            image: item.product.image
          })),
          shipping_cost: checkoutData.shippingCost || 0,
          tax_amount: checkoutData.taxAmount || 0,
          total_amount: checkoutData.totalAmount || cartTotal,
          shipping_info: {
            name: checkoutData.address.name,
            email: profile?.email || '',
            ...checkoutData.address.address
          },
          gift_options: {
            isGift: checkoutData.isGift || false,
            giftMessage: checkoutData.giftMessage || '',
            isSurpriseGift: false
          }
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (session?.url) {
        // Open payment in new tab for mobile
        window.open(session.url, '_blank');
        
        // Also complete the order callback
        onComplete({
          address: checkoutData.address,
          recipients: checkoutData.recipients,
          shippingOption: checkoutData.shippingOption,
          subtotal: checkoutData.subtotal || cartTotal,
          shippingCost: checkoutData.shippingCost || 0,
          taxAmount: checkoutData.taxAmount || 0,
          totalAmount: checkoutData.totalAmount || cartTotal,
          isGift: checkoutData.isGift || false,
          giftMessage: checkoutData.giftMessage
        } as MobileCheckoutData);
      }
    } catch (error) {
      console.error('Payment failed:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="lg:hidden">
      {/* Mobile Header */}
      <div className="sticky top-0 bg-white border-b p-4 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Checkout</h1>
            <p className="text-sm text-muted-foreground">
              {itemCount} item{itemCount !== 1 ? 's' : ''} • ${(checkoutData.totalAmount || cartTotal).toFixed(2)}
            </p>
          </div>
          <Badge variant="outline" className="text-xs">
            Step {steps.findIndex(s => s.id === currentStep) + 1} of {steps.length}
          </Badge>
        </div>
      </div>

      {/* Express Checkout Options */}
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => handleExpressCheckout('self')}
            className="h-12 flex-col gap-1"
            variant="outline"
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="text-xs">Buy for Me</span>
          </Button>
          <Button
            onClick={() => handleExpressCheckout('gift')}
            className="h-12 flex-col gap-1"
            variant="outline"
          >
            <Gift className="h-4 w-4" />
            <span className="text-xs">Send as Gift</span>
          </Button>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                step.completed ? 'bg-primary border-primary text-white' :
                step.id === currentStep ? 'border-primary text-primary' :
                'border-muted text-muted-foreground'
              }`}>
                {step.completed ? (
                  <div className="w-2 h-2 bg-white rounded-full" />
                ) : (
                  <step.icon className="h-4 w-4" />
                )}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-2 ${
                  step.completed ? 'bg-primary' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Current Step Content */}
      <div className="p-4 space-y-4">
        {currentStep === 'address' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Delivery Address</CardTitle>
            </CardHeader>
            <CardContent>
              {checkoutData.address ? (
                <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="font-medium">{checkoutData.address.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {checkoutData.address.address.street}, {checkoutData.address.address.city}, {checkoutData.address.address.state} {checkoutData.address.address.zipCode}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => setShowAddressSheet(true)}
                  >
                    Change Address
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground mb-4">Choose your delivery address</p>
                  <Sheet open={showAddressSheet} onOpenChange={setShowAddressSheet}>
                    <SheetTrigger asChild>
                      <Button className="w-full">
                        <MapPin className="h-4 w-4 mr-2" />
                        Select Address
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="h-[80vh]">
                      <SheetHeader>
                        <SheetTitle>Choose Address</SheetTitle>
                      </SheetHeader>
                      <div className="mt-4 overflow-y-auto">
                        <AddressBookSelector onAddressSelect={handleAddressSelect} />
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {currentStep === 'recipients' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recipients</CardTitle>
            </CardHeader>
            <CardContent>
              {checkoutData.recipients ? (
                <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="h-4 w-4 text-primary" />
                    <span className="font-medium">{checkoutData.recipients[0].name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {checkoutData.recipients[0].type === 'self' ? 'Delivering to yourself' : 'Gift recipient'}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => setShowRecipientsSheet(true)}
                  >
                    Change Recipient
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground mb-4">Who should receive these items?</p>
                  <Sheet open={showRecipientsSheet} onOpenChange={setShowRecipientsSheet}>
                    <SheetTrigger asChild>
                      <Button className="w-full">
                        <User className="h-4 w-4 mr-2" />
                        Select Recipient
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="h-[80vh]">
                      <SheetHeader>
                        <SheetTitle>Choose Recipient</SheetTitle>
                      </SheetHeader>
                      <div className="mt-4 overflow-y-auto">
                        <ConnectionAddressManager onConnectionSelect={handleRecipientSelect} />
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {currentStep === 'payment' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingShipping ? (
                <div className="text-center py-6">
                  <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-primary" />
                  <p className="text-muted-foreground">Calculating shipping and taxes...</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${(checkoutData.subtotal || cartTotal).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping:</span>
                      <span>${(checkoutData.shippingCost || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>${(checkoutData.taxAmount || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-medium text-base border-t pt-2">
                      <span>Total:</span>
                      <span>${(checkoutData.totalAmount || cartTotal).toFixed(2)}</span>
                    </div>
                  </div>
                  
                  {checkoutData.isGift && (
                    <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Gift className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm">Gift Message</span>
                      </div>
                      <textarea
                        placeholder="Add a personal message..."
                        className="w-full p-2 text-sm border rounded resize-none"
                        rows={3}
                        value={checkoutData.giftMessage || ''}
                        onChange={(e) => setCheckoutData(prev => ({ ...prev, giftMessage: e.target.value }))}
                      />
                    </div>
                  )}

                  <Button 
                    className="w-full"
                    onClick={handleCompleteOrder}
                    disabled={!checkoutData.address || !checkoutData.recipients || isProcessing || isLoadingShipping}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Pay ${(checkoutData.totalAmount || cartTotal).toFixed(2)}
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="sticky bottom-0 bg-white border-t p-4">
        <div className="flex gap-3">
          {currentStep !== 'address' && (
            <Button
              variant="outline"
              onClick={() => {
                const currentIndex = steps.findIndex(s => s.id === currentStep);
                if (currentIndex > 0) {
                  setCurrentStep(steps[currentIndex - 1].id as any);
                }
              }}
              className="flex-1"
            >
              Back
            </Button>
          )}
          {currentStep !== 'payment' && (
            <Button
              onClick={() => {
                const currentIndex = steps.findIndex(s => s.id === currentStep);
                if (currentIndex < steps.length - 1) {
                  setCurrentStep(steps[currentIndex + 1].id as any);
                }
              }}
              disabled={
                (currentStep === 'address' && !checkoutData.address) ||
                (currentStep === 'recipients' && !checkoutData.recipients)
              }
              className="flex-1"
            >
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileOptimizedCheckout;