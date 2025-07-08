import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { MapPin, User, CreditCard, Gift, ArrowRight, ShoppingBag, Clock } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useProfile } from '@/contexts/profile/ProfileContext';
import AddressBookSelector from './AddressBookSelector';
import ConnectionAddressManager from './ConnectionAddressManager';

interface MobileOptimizedCheckoutProps {
  onComplete: (checkoutData: any) => void;
}

const MobileOptimizedCheckout: React.FC<MobileOptimizedCheckoutProps> = ({
  onComplete
}) => {
  const { cartItems, cartTotal } = useCart();
  const { profile } = useProfile();
  const [currentStep, setCurrentStep] = useState<'address' | 'recipients' | 'payment'>('address');
  const [checkoutData, setCheckoutData] = useState<any>({});
  const [showAddressSheet, setShowAddressSheet] = useState(false);
  const [showRecipientsSheet, setShowRecipientsSheet] = useState(false);

  const steps = [
    { id: 'address', title: 'Address', icon: MapPin, completed: Boolean(checkoutData.address) },
    { id: 'recipients', title: 'Recipients', icon: User, completed: Boolean(checkoutData.recipients) },
    { id: 'payment', title: 'Payment', icon: CreditCard, completed: false }
  ];

  const handleAddressSelect = (address: any) => {
    setCheckoutData(prev => ({ ...prev, address }));
    setShowAddressSheet(false);
    if (currentStep === 'address') {
      setCurrentStep('recipients');
    }
  };

  const handleRecipientSelect = (recipient: any) => {
    setCheckoutData(prev => ({ ...prev, recipients: [recipient] }));
    setShowRecipientsSheet(false);
    if (currentStep === 'recipients') {
      setCurrentStep('payment');
    }
  };

  const handleExpressCheckout = (type: 'self' | 'gift') => {
    if (type === 'self' && profile?.shipping_address) {
      setCheckoutData(prev => ({ 
        ...prev, 
        address: profile.shipping_address,
        recipients: [{ name: profile.name, type: 'self' }]
      }));
      setCurrentStep('payment');
    } else {
      setCurrentStep('address');
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
              {itemCount} item{itemCount !== 1 ? 's' : ''} • ${cartTotal.toFixed(2)}
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
              <CardTitle className="text-lg">Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground mb-4">Complete your payment</p>
                <Button 
                  className="w-full"
                  onClick={() => onComplete(checkoutData)}
                  disabled={!checkoutData.address || !checkoutData.recipients}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Complete Order
                </Button>
              </div>
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