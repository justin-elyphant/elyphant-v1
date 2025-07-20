import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/auth';
import { Elements, useStripe, useElements, CardElement, PaymentRequestButtonElement } from '@stripe/react-stripe-js';
import { stripePromise } from '@/integrations/stripe/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, ChevronDown, ChevronUp, CreditCard, Apple, Shield, Lock, MapPin, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import SavedPaymentMethodsSection from './SavedPaymentMethodsSection';
import { useDefaultAddress } from '@/hooks/useDefaultAddress';
import { useProfile } from '@/contexts/profile/ProfileProvider';
import AddressBookSelector from './components/AddressBookSelector';
import ShippingAddressForm from '@/components/profile-setup/steps/shipping-address/ShippingAddressForm';
import { ShippingAddress } from '@/types/shipping';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface ShippingInfo {
  name: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

const ExpressCheckoutButtons = ({ paymentRequest, canMakePayment }: { paymentRequest: any, canMakePayment: boolean }) => {
  const stripe = useStripe();
  const elements = useElements();

  useEffect(() => {
    if (stripe && paymentRequest) {
      paymentRequest.update({
        currency: 'usd',
        total: {
          label: 'Total',
          amount: 1099,
        },
      });
    }
  }, [stripe, paymentRequest]);

  return (
    <div className="flex flex-col gap-2">
      {stripe && canMakePayment && paymentRequest && (
        <PaymentRequestButtonElement options={{ paymentRequest }} />
      )}
      <Button variant="outline" className="gap-2">
        <Apple className="h-4 w-4" />
        Pay with Apple Pay
      </Button>
    </div>
  );
};

const UnifiedCheckoutContent = () => {
  const navigate = useNavigate();
  const { cartItems, clearCart } = useCart();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { defaultAddress, loading: addressLoading } = useDefaultAddress();
  
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [showCardForm, setShowCardForm] = useState(false);
  const [showNewCardForm, setShowNewCardForm] = useState(false);
  const [savedMethodsRefreshKey, setSavedMethodsRefreshKey] = useState(0);
  const [mobileOrderExpanded, setMobileOrderExpanded] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState<any | null>(null);
  const [canMakePayment, setCanMakePayment] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>();

  // Enhanced shipping state management
  const [shippingInfo, setShippingInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US'
    }
  });
  const [showAddressBook, setShowAddressBook] = useState(false);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);

  // Auto-populate shipping info when default address or profile loads
  useEffect(() => {
    if (defaultAddress && !shippingInfo.name) {
      setShippingInfo(prev => ({
        ...prev,
        name: defaultAddress.name,
        email: prev.email || user?.email || '',
        address: {
          street: defaultAddress.address.street,
          city: defaultAddress.address.city,
          state: defaultAddress.address.state,
          zipCode: defaultAddress.address.zipCode,
          country: defaultAddress.address.country
        }
      }));
    } else if (profile && !shippingInfo.name && !defaultAddress) {
      // Fallback to profile data if no default address
      setShippingInfo(prev => ({
        ...prev,
        name: profile.name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
        email: prev.email || profile.email || user?.email || ''
      }));
    }
  }, [defaultAddress, profile, user, shippingInfo.name]);

  const stripe = useStripe();
  const elements = useElements();

  useEffect(() => {
    if (stripe) {
      const pr = stripe.paymentRequest({
        country: 'US',
        currency: 'usd',
        total: {
          label: 'Demo total',
          amount: 1099,
        },
        requestPayerName: true,
        requestPayerEmail: true,
      });

      pr.canMakePayment().then(result => {
        setCanMakePayment(!!result);
      });

      pr.on('paymentmethod', async (ev) => {
        setIsSubmitting(true);
        const { error: backendError, clientSecret } = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: 1099,
            currency: 'usd',
            payment_method_type: 'card',
          }),
        }).then(r => r.json());

        if (backendError) {
          setPaymentError(backendError);
          toast.error(backendError);
          ev.complete('fail');
          return;
        }

        const { paymentIntent, error: stripeError } = await stripe.confirmPayment({
          // `Elements` instance that was used to create the Payment Element
          elements,
          clientSecret: clientSecret,
          confirmParams: {
            return_url: `${window.location.origin}/return`,
          },
        });

        if (stripeError) {
          // Show error to your customer (for example, payment details incomplete)
          setPaymentError(stripeError.message || 'Payment failed');
          toast.error(stripeError.message || 'Payment failed');
          ev.complete('fail');
        } else if (paymentIntent && paymentIntent.status === 'succeeded') {
          // Your customer will be redirected to your `return_url`.
          ev.complete('success');
          toast.success('Payment succeeded!');
          clearCart();
          navigate('/success');
        }
        setIsSubmitting(false);
      });

      setPaymentRequest(pr);
    }
  }, [stripe, elements, clearCart, navigate]);

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const shippingCost = 5;
  const taxRate = 0.08;
  const tax = subtotal * taxRate;
  const total = subtotal + shippingCost + tax;

  const handleAddressSelect = (address: any) => {
    setShippingInfo(prev => ({
      ...prev,
      name: address.name,
      address: {
        street: address.address.street || address.address.address_line1 || '',
        city: address.address.city || '',
        state: address.address.state || '',
        zipCode: address.address.zipCode || address.address.zip_code || '',
        country: address.address.country || 'US'
      }
    }));
    setShowAddressBook(false);
  };

  const handleNewAddressSubmit = (address: ShippingAddress) => {
    setShippingInfo(prev => ({
      ...prev,
      address: {
        street: address.address_line1 || address.street || '',
        city: address.city || '',
        state: address.state || '',
        zipCode: address.zip_code || address.zipCode || '',
        country: address.country || 'US'
      }
    }));
    setShowNewAddressForm(false);
    toast.success('Address added successfully');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't loaded yet.
      // Make sure to disable form submission until Stripe.js has loaded.
      toast.error("Stripe.js hasn't loaded yet.");
      return;
    }

    setIsSubmitting(true);
    setPaymentError(null);

    try {
      // 1. Create Payment Intent on the server
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: total * 100, // Amount in cents
          currency: 'usd',
          payment_method_type: 'card',
        }),
      });

      const { clientSecret, error: backendError } = await response.json();

      if (backendError) {
        setPaymentError(backendError);
        toast.error(backendError);
        return;
      }

      // 2. Confirm the Payment Intent with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement) as CardElement,
            billing_details: {
              name: shippingInfo.name,
              email: shippingInfo.email,
              address: {
                city: shippingInfo.address.city,
                state: shippingInfo.address.state,
                postal_code: shippingInfo.address.zipCode,
                country: shippingInfo.address.country,
                line1: shippingInfo.address.street,
              },
            },
          },
          receipt_email: shippingInfo.email,
          shipping: {
            name: shippingInfo.name,
            address: {
              city: shippingInfo.address.city,
              state: shippingInfo.address.state,
              postal_code: shippingInfo.address.zipCode,
              country: shippingInfo.address.country,
              line1: shippingInfo.address.street,
            },
          },
        }
      );

      if (stripeError) {
        // Show error to your customer (for example, payment details incomplete)
        setPaymentError(stripeError.message || 'Payment failed');
        toast.error(stripeError.message || 'Payment failed');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment is successful
        toast.success('Payment succeeded!');
        clearCart();
        navigate('/success');
      }
    } catch (error: any) {
      // Handle any errors from the try block
      setPaymentError(error.message || 'An unexpected error occurred.');
      toast.error(error.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Main Form - Left Column */}
          <div className="lg:col-span-7">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Secure Checkout</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Complete your purchase securely with end-to-end encryption
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-8">
                {/* Express Checkout */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">Express Checkout</h3>
                    <Badge variant="secondary" className="text-xs">Recommended</Badge>
                  </div>
                  <ExpressCheckoutButtons paymentRequest={paymentRequest} canMakePayment={canMakePayment} />
                  <div className="relative">
                    <Separator />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="bg-background px-4 text-sm text-muted-foreground">or continue below</span>
                    </div>
                  </div>
                </div>

                {/* Shipping Information */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Shipping Information
                    </h3>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAddressBook(true)}
                        className="text-xs"
                      >
                        Address Book
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowNewAddressForm(true)}
                        className="text-xs"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add New
                      </Button>
                    </div>
                  </div>

                  {addressLoading ? (
                    <div className="animate-pulse space-y-4">
                      <div className="h-10 bg-gray-200 rounded"></div>
                      <div className="h-10 bg-gray-200 rounded"></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="h-10 bg-gray-200 rounded"></div>
                        <div className="h-10 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name</Label>
                          <Input
                            id="name"
                            value={shippingInfo.name}
                            onChange={(e) => setShippingInfo(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="John Doe"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={shippingInfo.email}
                            onChange={(e) => setShippingInfo(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="john@example.com"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="street">Street Address</Label>
                        <Input
                          id="street"
                          value={shippingInfo.address.street}
                          onChange={(e) => setShippingInfo(prev => ({ 
                            ...prev, 
                            address: { ...prev.address, street: e.target.value }
                          }))}
                          placeholder="123 Main St"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            value={shippingInfo.address.city}
                            onChange={(e) => setShippingInfo(prev => ({ 
                              ...prev, 
                              address: { ...prev.address, city: e.target.value }
                            }))}
                            placeholder="City"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="state">State</Label>
                          <Input
                            id="state"
                            value={shippingInfo.address.state}
                            onChange={(e) => setShippingInfo(prev => ({ 
                              ...prev, 
                              address: { ...prev.address, state: e.target.value }
                            }))}
                            placeholder="State"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="zipCode">ZIP Code</Label>
                          <Input
                            id="zipCode"
                            value={shippingInfo.address.zipCode}
                            onChange={(e) => setShippingInfo(prev => ({ 
                              ...prev, 
                              address: { ...prev.address, zipCode: e.target.value }
                            }))}
                            placeholder="12345"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone (Optional)</Label>
                          <Input
                            id="phone"
                            value={shippingInfo.phone}
                            onChange={(e) => setShippingInfo(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="(555) 123-4567"
                          />
                        </div>
                      </div>

                      {defaultAddress && (
                        <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded-lg border border-blue-200">
                          <p className="font-medium text-blue-800">Using your default address</p>
                          <p className="text-blue-600">You can change this anytime in your Address Book</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Gift Options */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Gift Options</h3>
                  <div className="flex items-center gap-2">
                    <Input type="checkbox" id="gift" className="h-5 w-5" />
                    <Label htmlFor="gift">Is this a gift?</Label>
                  </div>
                  <Input type="text" placeholder="Add a gift message" className="mt-2" />
                </div>

                {/* Scheduling */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Schedule Delivery</h3>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[240px] justify-start text-left font-normal",
                          !scheduledDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {scheduledDate ? (
                          format(scheduledDate, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="center">
                      <Calendar
                        mode="single"
                        selected={scheduledDate}
                        onSelect={setScheduledDate}
                        disabled={(date) =>
                          date < new Date()
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Payment Information */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Information
                  </h3>

                  <SavedPaymentMethodsSection
                    selectedMethod={selectedPaymentMethod}
                    onSelect={setSelectedPaymentMethod}
                    refreshKey={savedMethodsRefreshKey}
                  />

                  <Button variant="secondary" onClick={() => setShowNewCardForm(true)}>
                    Add New Card
                  </Button>

                  {showNewCardForm && (
                    <div className="border rounded-md p-4 mt-4">
                      <CardElement
                        options={{
                          style: {
                            base: {
                              fontSize: '16px',
                              color: '#424770',
                              '::placeholder': {
                                color: '#aab7c4',
                              },
                            },
                            invalid: {
                              color: '#9e2146',
                            },
                          },
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Terms and Conditions */}
                <div className="flex items-center space-x-2">
                  <Input type="checkbox" id="terms" className="h-5 w-5" />
                  <Label htmlFor="terms" className="text-sm">
                    I agree to the <a href="#" className="underline underline-offset-2">Terms and Conditions</a>
                  </Label>
                </div>

                {/* Submit Button */}
                {paymentError && (
                  <div className="text-destructive text-sm mt-2">
                    {paymentError}
                  </div>
                )}
                <Button className="w-full" size="lg" onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing Payment...
                    </>
                  ) : (
                    "Complete Order"
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary - Right Column */}
          <div className="lg:col-span-5">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl">Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>${shippingCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-muted-foreground">Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center mt-4 text-lg font-semibold">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>

                {/* Mobile Order Summary Toggle */}
                <div className="lg:hidden mt-6">
                  <Button variant="secondary" className="w-full justify-between" onClick={() => setMobileOrderExpanded(!mobileOrderExpanded)}>
                    {mobileOrderExpanded ? "Hide Order Details" : "Show Order Details"}
                    {mobileOrderExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>

                {/* Cart Items */}
                <div className={cn("mt-6 space-y-4", !mobileOrderExpanded && "hidden lg:block")}>
                  {cartItems.map((item: CartItem) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <img src={item.image || "placeholder_image_url"} alt={item.name} className="w-16 h-16 object-cover rounded mr-4" />
                        <div>
                          <div className="font-semibold">{item.name}</div>
                          <div className="text-muted-foreground text-sm">Quantity: {item.quantity}</div>
                        </div>
                      </div>
                      <div>${(item.price * item.quantity).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Address Book Modal */}
      {showAddressBook && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Select Address</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowAddressBook(false)}>
                ×
              </Button>
            </CardHeader>
            <CardContent>
              <AddressBookSelector
                onSelect={handleAddressSelect}
                onClose={() => setShowAddressBook(false)}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* New Address Form Modal */}
      {showNewAddressForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Add New Address</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowNewAddressForm(false)}>
                ×
              </Button>
            </CardHeader>
            <CardContent>
              <ShippingAddressForm
                address={{}}
                onChange={handleNewAddressSubmit}
              />
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setShowNewAddressForm(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setShowNewAddressForm(false)}>
                  Save Address
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

const UnifiedCheckoutForm = () => {
  return (
    <Elements stripe={stripePromise}>
      <UnifiedCheckoutContent />
    </Elements>
  );
};

export default UnifiedCheckoutForm;
