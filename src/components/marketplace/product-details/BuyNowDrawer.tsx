import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, ChevronRight, ChevronDown, Check, Plus, User, Gift } from "lucide-react";
import { SimpleRecipientSelector, SelectedRecipient as SelectorRecipient } from "./SimpleRecipientSelector";
import { Textarea } from "@/components/ui/textarea";
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
import { useIOSKeyboardResize } from "@/hooks/useIOSKeyboardResize";

import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";
import { triggerHapticFeedback } from "@/utils/haptics";
import { calculateDynamicPricingBreakdown } from "@/utils/orderPricingUtils";
import { useBetaCredits } from "@/hooks/useBetaCredits";
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

interface SelectedRecipient {
  type: 'self' | 'connection' | 'manual_address';
  name: string;
  address: any;
  connectionId?: string;
  recipientEmail?: string;
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
  const [selectedRecipient, setSelectedRecipient] = useState<SelectedRecipient | null>(null);
  const [giftNote, setGiftNote] = useState("");
  const [giftNoteOpen, setGiftNoteOpen] = useState(false);
  const [recipientOpen, setRecipientOpen] = useState(false);
  const [scheduledDate] = useState<string>("");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Shared iOS keyboard resize hook — sets --keyboard-viewport-height CSS var
  useIOSKeyboardResize();
  const { balance: betaCreditBalance } = useBetaCredits();

  const handleTextareaFocus = () => {
    setTimeout(() => {
      textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 350);
  };


  // userName for recipient selector
  const userName = defaultAddress?.name || 'Myself';

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

  // Auto-open payment section when no card exists but address is available
  useEffect(() => {
    if (!paymentLoading && !activePayment && defaultAddress) {
      setPaymentPickerOpen(true);
      setShowAddCardForm(true);
    }
  }, [paymentLoading, activePayment, defaultAddress]);

  const hasRequiredData = defaultAddress && activePayment && selectedRecipient !== null;

  const productName = product.title || product.name || "";
  const productImage = product.image || "";

  const handlePlaceOrder = async () => {
    if (!hasRequiredData) return;

    triggerHapticFeedback("medium");
    setPlacing(true);

    try {
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

      const isGift = selectedRecipient?.type === 'connection' || selectedRecipient?.type === 'manual_address';
      const recipientAddr = selectedRecipient?.address;

      const shippingInfo = isGift && recipientAddr ? {
        name: selectedRecipient.name,
        address_line1: recipientAddr.address_line1 || recipientAddr.street || "",
        address_line2: recipientAddr.address_line2 || "",
        city: recipientAddr.city,
        state: recipientAddr.state,
        zip_code: recipientAddr.zip_code || recipientAddr.zipCode || "",
        country: recipientAddr.country || "US",
      } : {
        // Use buyer's actual name from auth, not the address label (e.g. "Checkout Address")
        name: [user?.user_metadata?.first_name, user?.user_metadata?.last_name].filter(Boolean).join(' ')
          || user?.user_metadata?.name
          || defaultAddress!.name,
        address_line1: defaultAddress!.address.street,
        address_line2: defaultAddress!.address.address_line2 || "",
        city: defaultAddress!.address.city,
        state: defaultAddress!.address.state,
        zip_code: defaultAddress!.address.zipCode,
        country: defaultAddress!.address.country || "US",
      };

      const pricing = calculateDynamicPricingBreakdown(price, 6.99);

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
            scheduledDeliveryDate: scheduledDate || null,
            paymentMethod: activePayment?.stripe_payment_method_id || undefined,
            metadata: {
              user_id: user?.id,
              order_type: "standard",
              item_count: 1,
              source: "buy_now_drawer",
              delivery_scenario: isGift ? "gift" : "self",
              payment_method_id: activePayment?.stripe_payment_method_id || "",
              ...(isGift && selectedRecipient?.connectionId ? { recipient_connection_id: selectedRecipient.connectionId } : {}),
              ...(selectedRecipient?.type === 'manual_address' && selectedRecipient?.recipientEmail ? { recipient_email: selectedRecipient.recipientEmail, recipient_name: selectedRecipient.name } : {}),
              ...(giftNote.trim() ? { gift_message: giftNote.trim() } : {}),
            },
          },
        }
      );

      if (error) throw error;

      if (data?.url) {
        toast.success("Redirecting to payment...");
        window.location.href = data.url;
        return;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      console.error("Buy Now error:", err);
      setPlacing(false);
      toast.error("Something went wrong", {
        description: "Redirecting to full checkout...",
      });
      navigate("/checkout");
    }
  };

  const handleGoToSettings = () => {
    onOpenChange(false);
    navigate("/settings");
  };

  const formatCard = (method?: DefaultPaymentMethod | null) => {
    const pm = method || activePayment;
    if (!pm) return "";
    const type = pm.card_type.charAt(0).toUpperCase() + pm.card_type.slice(1);
    return `${type} ····${pm.last_four}`;
  };

  const handleSelectRecipient = (recipient: SelectedRecipient) => {
    setSelectedRecipient(recipient);
    triggerHapticFeedback("light");
    setRecipientOpen(false);
    // Don't auto-expand gift note — keep all sections closed by default
  };

  const handleSelectCard = (method: DefaultPaymentMethod) => {
    setSelectedPaymentMethod(method);
    setPaymentPickerOpen(false);
    triggerHapticFeedback("light");
  };

  return (
    <Drawer open={open && !(product as any).is_unavailable} onOpenChange={onOpenChange}>
      <DrawerContent className="flex flex-col sm:max-w-lg sm:mx-auto">
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
          ) : defaultAddress ? (
            <>
              {/* Step 1: Who is this for? — collapsible */}
              <Collapsible open={recipientOpen} onOpenChange={setRecipientOpen}>
                <CollapsibleTrigger asChild>
                  <button className="flex items-center justify-between w-full py-3 border-b border-border min-h-[44px] text-left">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Who is this for?</p>
                        <p className="text-sm">
                          {selectedRecipient ? selectedRecipient.name : 'Select recipient'}
                        </p>
                      </div>
                    </div>
                    {recipientOpen ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                    )}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="py-2 border-b border-border">
                    <SimpleRecipientSelector
                      embedded={true}
                      value={selectedRecipient ? {
                        type: selectedRecipient.type === 'self' ? 'self' : selectedRecipient.type === 'manual_address' ? 'manual_address' : 'connection',
                        connectionId: selectedRecipient.connectionId,
                        connectionName: selectedRecipient.name,
                        shippingAddress: selectedRecipient.address ? {
                          name: selectedRecipient.name,
                          address: selectedRecipient.address.address_line1 || selectedRecipient.address.street || '',
                          city: selectedRecipient.address.city || '',
                          state: selectedRecipient.address.state || '',
                          zipCode: selectedRecipient.address.zip_code || selectedRecipient.address.zipCode || '',
                          country: selectedRecipient.address.country || 'US',
                        } : undefined,
                      } : null}
                      onChange={(selected) => {
                        if (selected.type === 'manual_address') {
                          handleSelectRecipient({
                            type: 'manual_address',
                            name: selected.recipientName || selected.connectionName || 'Recipient',
                            address: selected.shippingAddress ? {
                              address_line1: selected.shippingAddress.address,
                              address_line2: selected.shippingAddress.addressLine2 || '',
                              city: selected.shippingAddress.city,
                              state: selected.shippingAddress.state,
                              zip_code: selected.shippingAddress.zipCode,
                              country: selected.shippingAddress.country || 'US',
                            } : null,
                            recipientEmail: selected.recipientEmail,
                          });
                        } else {
                          handleSelectRecipient({
                            type: selected.type === 'self' ? 'self' : 'connection',
                            name: selected.connectionName || userName,
                            address: selected.shippingAddress ? {
                              address_line1: selected.shippingAddress.address,
                              address_line2: selected.shippingAddress.addressLine2 || '',
                              city: selected.shippingAddress.city,
                              state: selected.shippingAddress.state,
                              zip_code: selected.shippingAddress.zipCode,
                              country: selected.shippingAddress.country || 'US',
                            } : defaultAddress?.address,
                            connectionId: selected.connectionId,
                          });
                        }
                      }}
                      userAddress={defaultAddress?.address}
                      userName={userName}
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Step 2: Gift note - collapsible */}
              <Collapsible open={giftNoteOpen} onOpenChange={setGiftNoteOpen}>
                <CollapsibleTrigger asChild>
                  <button className="flex items-center justify-between w-full py-3 border-b border-border min-h-[44px] text-left">
                    <div className="flex items-center gap-2">
                      <Gift className={`h-4 w-4 flex-shrink-0 ${giftNote.trim() ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className={`text-sm ${giftNote.trim() ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                        {giftNote.trim() ? 'Gift note added ✓' : 'Add a gift note'}
                      </span>
                    </div>
                    {giftNote.trim() && !giftNoteOpen ? (
                      <Check className="h-4 w-4 text-primary flex-shrink-0 ml-2" />
                    ) : giftNoteOpen ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                    )}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="py-2 border-b border-border">
                    <Textarea
                      ref={textareaRef}
                      onFocus={handleTextareaFocus}
                      value={giftNote}
                      onChange={(e) => setGiftNote(e.target.value.slice(0, 240))}
                      placeholder="Write a personal message to include with the gift..."
                      className="text-sm min-h-[72px] resize-none"
                      style={{ fontSize: '16px' }}
                      maxLength={240}
                    />
                    <p className="text-xs text-muted-foreground text-right mt-1">
                      {giftNote.length}/240
                    </p>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Step 3: Pay with */}
              <Collapsible open={paymentPickerOpen} onOpenChange={setPaymentPickerOpen}>
                <CollapsibleTrigger asChild>
                  <button className="flex items-center justify-between w-full py-3 border-b border-border min-h-[44px] text-left">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <CreditCard className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Pay with</p>
                        <p className="text-sm">{activePayment ? formatCard() : 'Add a payment method'}</p>
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

              {/* Step 4: Order Summary */}
              <div className="py-3 space-y-1.5">
              {(() => {
                  const breakdown = calculateDynamicPricingBreakdown(price, 6.99);
                  const BETA_CREDIT_PER_ORDER_CAP = 25;
                  const appliedCredit = Math.min(betaCreditBalance, breakdown.grandTotal, BETA_CREDIT_PER_ORDER_CAP);
                  const adjustedTotal = breakdown.grandTotal - appliedCredit;
                  return (
                    <>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Subtotal</span>
                        <span>${breakdown.basePrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Shipping</span>
                        <span>${breakdown.shippingCost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{breakdown.giftingFeeName}</span>
                        <span>${breakdown.giftingFee.toFixed(2)}</span>
                      </div>
                      {appliedCredit > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Beta Credit</span>
                          <span>-${appliedCredit.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="border-t border-muted my-1" />
                      <div className="flex justify-between font-medium">
                        <span>Total</span>
                        <span className="text-lg font-bold">${adjustedTotal.toFixed(2)}</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </>
          ) : (
            <div className="py-4 text-center">
              <p className="text-sm text-muted-foreground mb-3">
                Add a shipping address to use Buy Now
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
        {defaultAddress && activePayment && !isLoading && (
          <DrawerFooter className="pb-safe">
            <Button
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium min-h-[48px] text-base"
              onClick={handlePlaceOrder}
              disabled={placing || !selectedRecipient}
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
