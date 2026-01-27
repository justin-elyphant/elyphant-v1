import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Gift, ShieldCheck, ShieldAlert, Loader2, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/auth';
import { useProfile } from '@/contexts/profile/ProfileContext';
import { useAutoGifting } from '@/hooks/useAutoGifting';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Product } from '@/types/product';
import { RecipientAssignment } from '@/types/recipient';
import { triggerHapticFeedback } from '@/utils/haptics';
import Picker from 'react-mobile-picker';
import { PAYMENT_LEAD_TIME } from '@/lib/constants/paymentLeadTime';
import { calculateNextBirthday, PRESET_HOLIDAYS, calculateHolidayDate } from '@/constants/holidayDates';
import { unifiedGiftManagementService } from '@/services/UnifiedGiftManagementService';
import SimpleRecipientSelector, { SelectedRecipient } from '@/components/marketplace/product-details/SimpleRecipientSelector';
import PresetHolidaySelector from './PresetHolidaySelector';
import RecurringToggleSection from './RecurringToggleSection';


// Product context for saving hints when creating recurring rules
export interface ProductContext {
  productId: string;
  title: string;
  brand?: string;
  category?: string;
  price: number;
  image: string;
}

export type SchedulingMode = 'one-time' | 'recurring';

interface UnifiedGiftSchedulingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Context props
  product?: Product;
  productContext?: ProductContext;
  existingRecipient?: RecipientAssignment;
  // Mode control
  defaultMode?: SchedulingMode;
  allowModeSwitch?: boolean;
  // Variant props (from product page)
  hasVariations?: boolean;
  getEffectiveProductId?: () => string;
  getVariationDisplayText?: () => string;
  isVariationComplete?: () => boolean;
  // Callbacks
  onComplete?: (result: SchedulingResult) => void;
}

export interface SchedulingResult {
  mode: SchedulingMode;
  recipientId?: string;
  recipientName?: string;
  scheduledDate?: string;
  giftMessage?: string;
  ruleId?: string;
  occasionType?: string;
  alsoAddedToCart?: boolean;
}

const UnifiedGiftSchedulingModal: React.FC<UnifiedGiftSchedulingModalProps> = ({
  open,
  onOpenChange,
  product,
  productContext,
  existingRecipient,
  defaultMode = 'one-time',
  allowModeSwitch = true,
  hasVariations = false,
  getEffectiveProductId,
  getVariationDisplayText,
  isVariationComplete,
  onComplete
}) => {
  const isMobile = useIsMobile(1024);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { addToCart, assignItemToRecipient } = useCart();
  const { createRule, rules: existingRules } = useAutoGifting();

  // Core state
  const [selectedRecipient, setSelectedRecipient] = useState<SelectedRecipient | null>(null);
  const [giftMessage, setGiftMessage] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Preset/Holiday selection
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Recurring toggle state
  const [isRecurring, setIsRecurring] = useState(false);
  const [budget, setBudget] = useState(50);
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [autoApprove, setAutoApprove] = useState(false);
  const [notificationDays, setNotificationDays] = useState([7, 3, 1]);

  // iOS scroll wheel state for custom date
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear + 1].map(String);

  const getInitialPickerValues = () => {
    const futureDate = new Date(Date.now() + PAYMENT_LEAD_TIME.MIN_SCHEDULING_DAYS * 24 * 60 * 60 * 1000);
    return {
      month: months[futureDate.getMonth()],
      day: String(futureDate.getDate()),
      year: String(futureDate.getFullYear())
    };
  };

  const [pickerValue, setPickerValue] = useState(getInitialPickerValues);

  // User info
  const userAddress = profile?.shipping_address;
  const userName = profile?.name || 'Myself';
  const userDob = profile?.dob;

  // Calculate days in month
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const selectedMonthIndex = months.indexOf(pickerValue.month);
  const daysInMonth = getDaysInMonth(selectedMonthIndex, parseInt(pickerValue.year));
  const days = Array.from({ length: daysInMonth }, (_, i) => String(i + 1));

  // Get selected date from picker for custom dates
  const getPickerDate = useCallback((): Date => {
    const monthIndex = months.indexOf(pickerValue.month);
    return new Date(
      parseInt(pickerValue.year),
      monthIndex,
      parseInt(pickerValue.day),
      12, 0, 0
    );
  }, [pickerValue]);

  // Get the effective selected date (from picker or preset)
  const effectiveDate = useMemo(() => {
    if (selectedDate) return selectedDate;
    return getPickerDate();
  }, [selectedDate, getPickerDate]);

  // Calculate recipient's next birthday if available
  const recipientBirthdayDate = useMemo(() => {
    if (selectedRecipient?.type === 'self' && userDob) {
      return calculateNextBirthday(userDob);
    }
    if (selectedRecipient?.recipientDob) {
      return calculateNextBirthday(selectedRecipient.recipientDob);
    }
    return null;
  }, [selectedRecipient, userDob]);

  // Determine the recipient's DOB string to pass to PresetHolidaySelector
  const recipientDobForPresets = useMemo(() => {
    if (selectedRecipient?.type === 'self') return userDob || undefined;
    return selectedRecipient?.recipientDob;
  }, [selectedRecipient, userDob]);

  // Determine the recipient's important dates to pass to PresetHolidaySelector
  const recipientImportantDatesForPresets = useMemo(() => {
    if (selectedRecipient?.type === 'self') {
      // For self, we could potentially use profile.important_dates if needed
      return [];
    }
    return selectedRecipient?.recipientImportantDates || [];
  }, [selectedRecipient]);

  // Check if recurring rule already exists for this recipient+occasion
  const hasExistingRule = useMemo(() => {
    if (!selectedRecipient?.connectionId || !selectedPreset) return false;
    return existingRules.some(
      rule => rule.recipient_id === selectedRecipient.connectionId && 
              rule.date_type === selectedPreset &&
              rule.is_active
    );
  }, [existingRules, selectedRecipient, selectedPreset]);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setGiftMessage('');
      setSelectedPreset(null);
      setSelectedDate(null);
      setIsRecurring(false);
      setBudget(product?.price ? Math.round(product.price * 1.2) : 50);
      setPaymentMethodId('');
      setAutoApprove(false);
      setNotificationDays([7, 3, 1]);
      setPickerValue(getInitialPickerValues());
      
      // Pre-populate recipient if editing from cart
      if (existingRecipient) {
        setSelectedRecipient({
          type: existingRecipient.connectionId === 'self' ? 'self' : 'connection',
          connectionId: existingRecipient.connectionId,
          connectionName: existingRecipient.connectionName,
          shippingAddress: existingRecipient.shippingAddress,
          addressVerified: existingRecipient.address_verified
        });
        if (existingRecipient.giftMessage) {
          setGiftMessage(existingRecipient.giftMessage);
        }
      } else {
        setSelectedRecipient(null);
      }
    }
  }, [open, existingRecipient, product?.price]);

  // Handle preset selection - updates picker to match
  const handlePresetSelect = (presetKey: string, date: Date) => {
    setSelectedPreset(presetKey);
    setSelectedDate(date);
    // Sync picker to match the selected holiday date
    setPickerValue({
      month: months[date.getMonth()],
      day: String(date.getDate()),
      year: String(date.getFullYear())
    });
  };

  // Handle picker change - clears preset selection
  const handlePickerChange = (value: { month: string; day: string; year: string }) => {
    setPickerValue(value);
    setSelectedPreset(null);
    setSelectedDate(null); // Will use getPickerDate() via effectiveDate
  };

  // Handle clearing preset from dropdown
  const handlePresetClear = () => {
    setSelectedPreset(null);
    setSelectedDate(null);
  };

  // Handle invite new recipient
  const handleInviteNew = async (name: string, email: string) => {
    if (!user) {
      toast.error('Please sign in to invite recipients');
      return;
    }

    setIsInviting(true);
    try {
      const connection = await unifiedGiftManagementService.createPendingConnection(
        email, name, 'friend', user.id
      );

      if (connection?.id) {
        setSelectedRecipient({
          type: 'connection',
          connectionId: connection.id,
          connectionName: name,
          addressVerified: false
        });
        toast.success('Invitation sent!', {
          description: `${name} will receive an email to share their address`
        });
      }
    } catch (error) {
      console.error('Error inviting recipient:', error);
      toast.error('Failed to send invitation');
    } finally {
      setIsInviting(false);
    }
  };

  // Validate date meets minimum lead time
  const validateDate = (): boolean => {
    if (!effectiveDate) {
      toast.error('Please select a delivery date');
      return false;
    }

    const minDate = new Date();
    minDate.setDate(minDate.getDate() + PAYMENT_LEAD_TIME.MIN_SCHEDULING_DAYS);
    minDate.setHours(0, 0, 0, 0);

    if (effectiveDate < minDate) {
      toast.error(`Please select a date at least ${PAYMENT_LEAD_TIME.MIN_SCHEDULING_DAYS} days from now`);
      return false;
    }
    return true;
  };

  // Build product hints for recurring rules
  const buildProductHints = () => {
    const ctx = productContext || (product ? {
      productId: String(product.product_id || product.id),
      title: product.title || product.name || '',
      brand: product.brand,
      category: product.category || product.category_name,
      price: product.price,
      image: product.image
    } : undefined);
    
    if (!ctx) return undefined;
    
    return {
      productId: ctx.productId,
      title: ctx.title,
      brand: ctx.brand,
      category: ctx.category,
      priceRange: [Math.floor(ctx.price * 0.8), Math.ceil(ctx.price * 1.2)] as [number, number],
      image: ctx.image
    };
  };

  // Unified submit handler
  const handleSchedule = async () => {
    if (!validateDate()) return;
    if (!effectiveDate) return;

    // Validate variation selection if product page
    if (product && hasVariations && isVariationComplete && !isVariationComplete()) {
      toast.error('Please select all product options');
      return;
    }

    setIsSubmitting(true);

    try {
      const effectiveProductId = getEffectiveProductId 
        ? getEffectiveProductId() 
        : String(product?.product_id || product?.id);
      const variationText = getVariationDisplayText ? getVariationDisplayText() : undefined;

      // Step 1: ALWAYS add to cart (if product exists)
      if (product) {
        const cartProduct = {
          ...product,
          product_id: effectiveProductId,
          image: product.image,
          images: product.images,
          variationText
        };
        addToCart(cartProduct);

        // Assign recipient
        if (selectedRecipient && selectedRecipient.type !== 'later') {
          const recipientAssignment: RecipientAssignment = {
            connectionId: selectedRecipient.type === 'self' ? 'self' : (selectedRecipient.connectionId || ''),
            connectionName: selectedRecipient.type === 'self' ? userName : (selectedRecipient.connectionName || ''),
            deliveryGroupId: `gift_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            scheduledDeliveryDate: effectiveDate.toISOString(),
            giftMessage: giftMessage || undefined,
            shippingAddress: selectedRecipient.shippingAddress,
            address_verified: selectedRecipient.addressVerified
          };
          assignItemToRecipient(effectiveProductId, recipientAssignment);
        }
      }

      // Step 2: Create recurring rule ONLY if toggle is ON
      let createdRuleId: string | undefined;
      if (isRecurring && selectedRecipient?.connectionId && !hasExistingRule) {
        const dateType = selectedPreset || 'custom';
        const productHints = buildProductHints();
        
        const ruleData = {
          recipient_id: selectedRecipient.connectionId,
          date_type: dateType,
          scheduled_date: effectiveDate.toISOString().split('T')[0],
          budget_limit: budget,
          payment_method_id: paymentMethodId || undefined,
          notification_preferences: {
            enabled: true,
            days_before: notificationDays,
            email: true,
            push: false
          },
          gift_selection_criteria: {
            source: 'ai' as const,
            categories: productHints?.category ? [productHints.category] : [],
            max_price: budget,
            exclude_items: [],
            preferred_brands: productHints?.brand ? [productHints.brand] : []
          },
          is_active: true
        };
        
        const ruleResult = await createRule(ruleData);
        createdRuleId = ruleResult?.id;
        
        triggerHapticFeedback('success');
        
        const presetLabel = PRESET_HOLIDAYS[dateType]?.label || 'this date';
        toast.success('Recurring gift set up!', {
          description: `Will also send a gift for ${presetLabel} every year`
        });
      }

      // Success feedback
      triggerHapticFeedback('success');
      const recipientText = selectedRecipient?.type === 'self'
        ? `to ${userName}`
        : selectedRecipient?.type === 'connection'
          ? `to ${selectedRecipient.connectionName}`
          : '';

      toast.success(isRecurring && !hasExistingRule ? 'Gift scheduled + recurring rule created!' : 'Gift scheduled!', {
        description: `Will be delivered ${recipientText} on ${format(effectiveDate, 'PPP')}`.trim(),
        action: product ? {
          label: 'View Cart',
          onClick: () => navigate('/cart')
        } : undefined
      });

      onComplete?.({
        mode: isRecurring ? 'recurring' : 'one-time',
        recipientId: selectedRecipient?.connectionId,
        recipientName: selectedRecipient?.connectionName,
        scheduledDate: effectiveDate.toISOString().split('T')[0],
        giftMessage,
        ruleId: createdRuleId,
        occasionType: selectedPreset || undefined,
        alsoAddedToCart: !!product
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Error scheduling gift:', error);
      toast.error('Failed to schedule gift');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get submit button text
  const getSubmitButtonText = () => {
    if (isSubmitting) return 'Scheduling...';
    if (isRecurring && !hasExistingRule) return 'Schedule Gift + Set Recurring';
    return 'Schedule Gift';
  };

  // Modal content
  const ModalContent = () => (
    <div className="space-y-5">
      {/* Recipient Selection */}
      <div>
        <label className="text-sm font-semibold text-foreground mb-2 block">
          Who is this gift for?
        </label>
        <SimpleRecipientSelector
          value={selectedRecipient}
          onChange={setSelectedRecipient}
          userAddress={userAddress}
          userName={userName}
          onInviteNew={handleInviteNew}
        />

        {/* Address Verification Status */}
        {selectedRecipient && selectedRecipient.type !== 'later' && (
          <div className="mt-2">
            {selectedRecipient.type === 'self' || selectedRecipient.addressVerified ? (
              <div className="flex items-center gap-1.5 text-xs text-green-600">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Address verified</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-amber-600">
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Address will be verified at checkout</span>
              </div>
            )}
          </div>
        )}

        {isInviting && (
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Sending invitation...</span>
          </div>
        )}
      </div>

      <Separator />

      {/* Delivery Date Section */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-foreground block">
          Delivery Date
        </label>
        
        {/* iOS Scroll Wheel Picker - Always Visible */}
        <div className="bg-muted/30 rounded-lg py-3">
          <Picker
            value={pickerValue}
            onChange={(value) => handlePickerChange(value as { month: string; day: string; year: string })}
            wheelMode="natural"
            height={160}
          >
            <Picker.Column name="month">
              {months.map((month) => (
                <Picker.Item key={month} value={month}>
                  {month}
                </Picker.Item>
              ))}
            </Picker.Column>
            <Picker.Column name="day">
              {days.map((day) => (
                <Picker.Item key={day} value={day}>
                  {day}
                </Picker.Item>
              ))}
            </Picker.Column>
            <Picker.Column name="year">
              {years.map((year) => (
                <Picker.Item key={year} value={year}>
                  {year}
                </Picker.Item>
              ))}
            </Picker.Column>
          </Picker>
        </div>

        {/* Selected Date Preview */}
        {effectiveDate && (
          <p className="text-xs text-muted-foreground text-center">
            Gift will arrive on or before <span className="font-medium text-foreground">{format(effectiveDate, 'PPP')}</span>
          </p>
        )}
      </div>

      {/* Popular Holidays/Events Dropdown */}
      <PresetHolidaySelector
        selectedPreset={selectedPreset}
        recipientDob={recipientDobForPresets}
        recipientName={selectedRecipient?.type === 'connection' ? selectedRecipient.connectionName : undefined}
        recipientImportantDates={recipientImportantDatesForPresets}
        onPresetSelect={handlePresetSelect}
        onClear={handlePresetClear}
      />

      <Separator />

      {/* Gift Message */}
      <div>
        <label className="text-sm font-semibold text-foreground mb-2 block">
          Gift Message (Optional)
        </label>
        <Textarea
          placeholder="Add a personal message..."
          value={giftMessage}
          onChange={(e) => setGiftMessage(e.target.value)}
          maxLength={200}
          rows={2}
          className="resize-none text-base"
        />
        <p className="text-xs text-muted-foreground mt-1">
          {giftMessage.length}/200 characters
        </p>
      </div>

      {/* Recurring Toggle Section */}
      {allowModeSwitch && selectedRecipient?.type === 'connection' && selectedPreset && (
        <RecurringToggleSection
          isRecurring={isRecurring}
          onToggle={setIsRecurring}
          detectedHoliday={selectedPreset && PRESET_HOLIDAYS[selectedPreset] 
            ? { key: selectedPreset, label: PRESET_HOLIDAYS[selectedPreset].label } 
            : null
          }
          budget={budget}
          onBudgetChange={setBudget}
          paymentMethodId={paymentMethodId}
          onPaymentMethodChange={setPaymentMethodId}
          autoApprove={autoApprove}
          onAutoApproveChange={setAutoApprove}
          notificationDays={notificationDays}
          onNotificationDaysChange={setNotificationDays}
        />
      )}

      {/* Existing Rule Notice */}
      {hasExistingRule && isRecurring && (
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          A recurring gift is already set up for this recipient and occasion. 
          This gift will be added to cart only.
        </div>
      )}
    </div>
  );

  // Footer buttons
  const FooterButtons = ({ className }: { className?: string }) => (
    <div className={cn("flex flex-row gap-3 w-full", className)}>
      <Button
        variant="outline"
        className="flex-1 h-11 min-h-[44px]"
        onClick={() => onOpenChange(false)}
        disabled={isSubmitting}
      >
        Cancel
      </Button>
      <Button
        className="flex-1 h-11 min-h-[44px] bg-primary hover:bg-primary/90 text-primary-foreground"
        onClick={handleSchedule}
        disabled={isSubmitting || !effectiveDate}
      >
        {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        {getSubmitButtonText()}
      </Button>
    </div>
  );

  // Render responsive container
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh] pb-safe">
          <DrawerHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <DrawerTitle className="flex items-center gap-2 text-lg font-bold">
                <Gift className="h-5 w-5" />
                Schedule Gift
              </DrawerTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DrawerHeader>

          <div className="p-4 overflow-y-auto flex-1">
            <ModalContent />
          </div>

          <DrawerFooter className="border-t pt-4">
            <FooterButtons className="w-full" />
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Gift className="h-5 w-5" />
            Schedule Gift
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 py-2">
          <ModalContent />
        </div>

        <div className="flex-shrink-0 border-t pt-4 mt-2">
          <FooterButtons />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UnifiedGiftSchedulingModal;
