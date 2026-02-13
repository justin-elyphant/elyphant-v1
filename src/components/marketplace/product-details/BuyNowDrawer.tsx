import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, CreditCard, ChevronRight, ChevronDown, Check, Plus } from "lucide-react";
import { Elements } from "@stripe/react-stripe-js";
import stripeClientManager from "@/services/payment/StripeClientManager";
import UnifiedPaymentForm from "@/components/payments/UnifiedPaymentForm";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useDefaultAddress } from "@/hooks/useDefaultAddress";
import { useDefaultPaymentMethod, DefaultPaymentMethod } from "@/hooks/useDefaultPaymentMethod";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";
import { triggerHapticFeedback } from "@/utils/haptics";
import { calculateDynamicPricingBreakdown } from "@/utils/orderPricingUtils";
import { toast } from "sonner";
import { Product } from "@/types/product";

interface BuyNowDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product;
  effectiveProductId: string;
  variationText: string;
  price: number;
}

const BuyNowDrawer: React.FC<BuyNowDrawerProps> = ({
  open,
  onOpenChange,
  product,
  effectiveProductId,
  variationText,
  price,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { defaultAddress, loading: addressLoading } = useDefaultAddress();
  const { defaultPaymentMethod, loading: paymentLoading } = useDefaultPaymentMethod();
  const [placing, setPlacing] = useState(false);
  const [paymentPickerOpen, setPaymentPickerOpen] = useState(false);
  const [allPaymentMethods, setAllPaymentMethods] = useState<DefaultPaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<DefaultPaymentMethod | null>(null);
  const [showAddCardForm, setShowAddCardForm] = useState(false);

  // Sync default payment method
  useEffect(() => {
    if (defaultPaymentMethod && !selectedPaymentMethod) {
      setSelectedPaymentMethod(defaultPaymentMethod);
    }
  }, [defaultPaymentMethod]);

  // Fetch all saved payment methods when picker opens
  useEffect(() => {
    if (!paymentPickerOpen || !user) return;
    const fetchAll = async () => {
      const { data } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });
      if (data) setAllPaymentMethods(data as DefaultPaymentMethod[]);
    };
    fetchAll();
  }, [paymentPickerOpen, user]);

  const isLoading = addressLoading || paymentLoading;
  const activePayment = selectedPaymentMethod || defaultPaymentMethod;
  const hasRequiredData = defaultAddress && activePayment;

  const productName = product.title || product.name || "";
  const productImage = product.image || "";

  const handlePlaceOrder = async () => {
    if (!hasRequiredData) return;

    triggerHapticFeedback("medium");
    setPlacing(true);

    try {
      // Get current user for metadata
      const { data: { user } } = await supabase.auth.getUser();

      const cartItem = {
        product_id: effectiveProductId,
        name: productName,
        price,
        quantity: 1,
        image_url: productImage,
        retailer: product.retailer || "amazon",
        variationText: variationText || undefined,
      };

      const shippingInfo = {
        name: defaultAddress.name,
        address_line1: defaultAddress.address.street,
        address_line2: defaultAddress.address.address_line2 || "",
        city: defaultAddress.address.city,
        state: defaultAddress.address.state,
        zip_code: defaultAddress.address.zipCode,
        country: defaultAddress.address.country || "US",
      };

      const pricing = calculateDynamicPricingBreakdown(price);

      const { data, error } = await supabase.functions.invoke(
        "create-checkout-session",
        {
          body: {
            cartItems: [cartItem],
            shippingInfo,
            pricingBreakdown: {
              subtotal: pricing.basePrice,
              shippingCost: pricing.shippingCost,
              giftingFee: pricing.giftingFee,
              giftingFeeName: pricing.giftingFeeName,
              giftingFeeDescription: pricing.giftingFeeDescription,
              taxAmount: 0,
            },
            // Pass saved payment method so Stripe pre-selects it
            paymentMethod: activePayment?.stripe_payment_method_id || undefined,
            metadata: {
              user_id: user?.id,
              order_type: "standard",
              item_count: 1,
              source: "buy_now_drawer",
              delivery_scenario: "self",
              payment_method_id: activePayment?.stripe_payment_method_id || "",
            },
          },
        }
      );

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      console.error("Buy Now error:", err);
      toast.error("Something went wrong", {
        description: "Redirecting to full checkout...",
      });
      // Fallback to standard checkout
      navigate("/checkout");
    } finally {
      setPlacing(false);
    }
  };

  const handleGoToSettings = () => {
    onOpenChange(false);
    navigate("/settings");
  };

  const formatAddress = () => {
    if (!defaultAddress) return "";
    const { street, city, state, zipCode } = defaultAddress.address;
    const shortStreet = street.length > 25 ? street.slice(0, 25) + "..." : street;
    return `${defaultAddress.name}, ${shortStreet}, ${city}, ${state} ${zipCode}`;
  };

  const formatCard = (method?: DefaultPaymentMethod | null) => {
    const pm = method || activePayment;
    if (!pm) return "";
    const type = pm.card_type.charAt(0).toUpperCase() + pm.card_type.slice(1);
    return `${type} ····${pm.last_four}`;
  };

  const handleSelectCard = (method: DefaultPaymentMethod) => {
    setSelectedPaymentMethod(method);
    setPaymentPickerOpen(false);
    triggerHapticFeedback("light");
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh] flex flex-col">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="sr-only">Buy Now</DrawerTitle>
          {/* Product summary */}
          <div className="flex items-start gap-3">
            {productImage && (
              <img
                src={productImage}
                alt={productName}
                className="w-16 h-16 object-contain rounded-md border border-border bg-muted/30 flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium leading-tight line-clamp-2">
                {productName}
              </p>
              {variationText && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {variationText}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-0.5">
                Ships from Elyphant
              </p>
            </div>
          </div>
        </DrawerHeader>

        {/* Order details */}
        <div className="px-4 py-2 space-y-0 flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-3 py-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : hasRequiredData ? (
            <>
              {/* Ship to */}
              <button
                onClick={handleGoToSettings}
                className="flex items-center justify-between w-full py-3 border-b border-border min-h-[44px] text-left"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Ship to</p>
                    <p className="text-sm truncate">{formatAddress()}</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
              </button>

              {/* Pay with - inline collapsible picker */}
              <Collapsible open={paymentPickerOpen} onOpenChange={setPaymentPickerOpen}>
                <CollapsibleTrigger asChild>
                  <button
                    className="flex items-center justify-between w-full py-3 border-b border-border min-h-[44px] text-left"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <CreditCard className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Pay with</p>
                        <p className="text-sm">{formatCard()}</p>
                      </div>
                    </div>
                    {paymentPickerOpen ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                    )}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="py-2 space-y-1 border-b border-border">
                    {allPaymentMethods.map((method) => (
                      <button
                        key={method.id}
                        onClick={() => handleSelectCard(method)}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md hover:bg-accent/50 transition-colors min-h-[44px] text-left"
                      >
                        <CreditCard className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm flex-1">{formatCard(method)}</span>
                        {activePayment?.id === method.id && (
                          <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        )}
                      </button>
                    ))}
                    {!showAddCardForm ? (
                      <button
                        onClick={() => setShowAddCardForm(true)}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md hover:bg-accent/50 transition-colors min-h-[44px] text-left text-muted-foreground"
                      >
                        <Plus className="h-4 w-4" />
                        <span className="text-sm">Add new card</span>
                      </button>
                    ) : (
                      <div className="px-2 py-3">
                        <Elements stripe={stripeClientManager.getStripePromise()}>
                          <UnifiedPaymentForm
                            mode="setup"
                            amount={0}
                            onSuccess={async () => {
                              setShowAddCardForm(false);
                              // Re-fetch payment methods and auto-select newest
                              if (user) {
                                const { data } = await supabase
                                  .from('payment_methods')
                                  .select('*')
                                  .eq('user_id', user.id)
                                  .order('created_at', { ascending: false });
                                if (data && data.length > 0) {
                                  setAllPaymentMethods(data as DefaultPaymentMethod[]);
                                  setSelectedPaymentMethod(data[0] as DefaultPaymentMethod);
                                }
                              }
                              toast.success("Card saved successfully");
                            }}
                            onError={(error) => {
                              toast.error("Failed to save card", { description: error });
                            }}
                            buttonText="Save Card"
                          />
                        </Elements>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full mt-2 text-muted-foreground"
                          onClick={() => setShowAddCardForm(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Total */}
              <div className="flex items-center justify-between py-3">
                <span className="text-sm font-medium">Total</span>
                <div className="text-right">
                  <span className="text-lg font-bold">${calculateDynamicPricingBreakdown(price).grandTotal.toFixed(2)}</span>
                  <p className="text-xs text-muted-foreground">(includes fees)</p>
                </div>
              </div>
            </>
          ) : (
            <div className="py-4 text-center">
              <p className="text-sm text-muted-foreground mb-3">
                {!defaultAddress && !defaultPaymentMethod
                  ? "Add a shipping address and payment method to use Buy Now"
                  : !defaultAddress
                  ? "Add a shipping address to use Buy Now"
                  : "Add a payment method to use Buy Now"}
              </p>
              <Button
                variant="outline"
                className="min-h-[44px]"
                onClick={() => {
                  onOpenChange(false);
                  navigate("/settings");
                }}
              >
                Go to Settings
              </Button>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        {hasRequiredData && !isLoading && (
          <DrawerFooter className="pb-safe">
            <Button
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium min-h-[48px] text-base"
              onClick={handlePlaceOrder}
              disabled={placing}
            >
              {placing ? "Placing order..." : "Place your order"}
            </Button>
            <DrawerClose asChild>
              <Button variant="ghost" className="w-full min-h-[44px] text-muted-foreground">
                Cancel
              </Button>
            </DrawerClose>
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
};

export default BuyNowDrawer;
