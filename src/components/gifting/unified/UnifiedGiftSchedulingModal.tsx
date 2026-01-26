import React, { useState, useEffect, useCallback } from 'react';
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
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Product } from '@/types/product';
import { RecipientAssignment } from '@/types/recipient';
import { triggerHapticFeedback } from '@/utils/haptics';
import Picker from 'react-mobile-picker';
import { PAYMENT_LEAD_TIME } from '@/lib/constants/paymentLeadTime';
import { detectHolidayFromDate } from '@/constants/holidayDates';
import { unifiedGiftManagementService } from '@/services/UnifiedGiftManagementService';
import SimpleRecipientSelector, { SelectedRecipient } from '@/components/marketplace/product-details/SimpleRecipientSelector';
import SchedulingModeToggle, { SchedulingMode } from './SchedulingModeToggle';
import HolidayConversionBanner from './HolidayConversionBanner';
import AutoGiftSetupFlow from '@/components/gifting/auto-gift/AutoGiftSetupFlow';

interface UnifiedGiftSchedulingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Context props
  product?: Product;
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
  // Recurring-specific
  ruleId?: string;
  occasionType?: string;
}

const UnifiedGiftSchedulingModal: React.FC<UnifiedGiftSchedulingModalProps> = ({
  open,
  onOpenChange,
  product,
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

  // State
  const [mode, setMode] = useState<SchedulingMode>(defaultMode);
  const [selectedRecipient, setSelectedRecipient] = useState<SelectedRecipient | null>(null);
  const [giftMessage, setGiftMessage] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  // One-time scheduling state (iOS scroll wheel)
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

  // Holiday detection state
  const [detectedHoliday, setDetectedHoliday] = useState<{ key: string; label: string } | null>(null);
  const [holidayBannerDismissed, setHolidayBannerDismissed] = useState(false);

  // User info
  const userAddress = profile?.shipping_address;
  const userName = profile?.name || 'Myself';

  // Calculate days in month
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const selectedMonthIndex = months.indexOf(pickerValue.month);
  const daysInMonth = getDaysInMonth(selectedMonthIndex, parseInt(pickerValue.year));
  const days = Array.from({ length: daysInMonth }, (_, i) => String(i + 1));

  // Get selected date from picker
  const getSelectedDate = useCallback((): Date => {
    const monthIndex = months.indexOf(pickerValue.month);
    return new Date(
      parseInt(pickerValue.year),
      monthIndex,
      parseInt(pickerValue.day)
    );
  }, [pickerValue]);

  // Detect holidays when date changes
  useEffect(() => {
    if (mode !== 'one-time') return;
    
    const selectedDate = getSelectedDate();
    const holiday = detectHolidayFromDate(selectedDate);
    
    if (holiday && !holidayBannerDismissed) {
      setDetectedHoliday(holiday);
      triggerHapticFeedback('light');
    } else {
      setDetectedHoliday(null);
    }
  }, [pickerValue, mode, holidayBannerDismissed, getSelectedDate]);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setMode(defaultMode);
      setGiftMessage('');
      setHolidayBannerDismissed(false);
      setDetectedHoliday(null);
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
  }, [open, defaultMode, existingRecipient]);

  // Handle holiday conversion (one-time → recurring)
  const handleHolidayConversion = () => {
    if (detectedHoliday) {
      setMode('recurring');
      setDetectedHoliday(null);
      toast.success(`Switched to recurring mode for ${detectedHoliday.label}`);
    }
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
    const selectedDate = getSelectedDate();
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + PAYMENT_LEAD_TIME.MIN_SCHEDULING_DAYS);
    minDate.setHours(0, 0, 0, 0);

    if (selectedDate < minDate) {
      toast.error(`Please select a date at least ${PAYMENT_LEAD_TIME.MIN_SCHEDULING_DAYS} days from now`);
      return false;
    }
    return true;
  };

  // Handle one-time scheduling (add to cart)
  const handleOneTimeSchedule = () => {
    if (!validateDate()) return;

    // Validate variation selection if product page
    if (product && hasVariations && isVariationComplete && !isVariationComplete()) {
      toast.error('Please select all product options');
      return;
    }

    const selectedDate = getSelectedDate();
    const effectiveProductId = getEffectiveProductId 
      ? getEffectiveProductId() 
      : String(product?.product_id || product?.id);
    const variationText = getVariationDisplayText ? getVariationDisplayText() : undefined;

    // Add to cart if product exists
    if (product) {
      const cartProduct = {
        ...product,
        product_id: effectiveProductId,
        image: product.image,
        images: product.images,
        variationText
      };
      addToCart(cartProduct);
    }

    // Assign recipient
    if (selectedRecipient && selectedRecipient.type !== 'later') {
      const recipientAssignment: RecipientAssignment = {
        connectionId: selectedRecipient.type === 'self' ? 'self' : (selectedRecipient.connectionId || ''),
        connectionName: selectedRecipient.type === 'self' ? userName : (selectedRecipient.connectionName || ''),
        deliveryGroupId: `gift_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        scheduledDeliveryDate: selectedDate.toISOString(),
        giftMessage: giftMessage || undefined,
        shippingAddress: selectedRecipient.shippingAddress,
        address_verified: selectedRecipient.addressVerified
      };

      if (product) {
        assignItemToRecipient(effectiveProductId, recipientAssignment);
      }
    }

    // Success feedback
    triggerHapticFeedback('success');
    const recipientText = selectedRecipient?.type === 'self'
      ? `to ${userName}`
      : selectedRecipient?.type === 'connection'
        ? `to ${selectedRecipient.connectionName}`
        : '';

    toast.success('Gift scheduled!', {
      description: `Will be delivered ${recipientText} on ${format(selectedDate, 'PPP')}`.trim(),
      action: product ? {
        label: 'View Cart',
        onClick: () => navigate('/cart')
      } : undefined
    });

    onComplete?.({
      mode: 'one-time',
      recipientId: selectedRecipient?.connectionId,
      recipientName: selectedRecipient?.connectionName,
      scheduledDate: selectedDate.toISOString().split('T')[0],
      giftMessage
    });

    onOpenChange(false);
  };

  // Handle recurring rule creation complete
  const handleRecurringComplete = () => {
    onComplete?.({
      mode: 'recurring',
      recipientId: selectedRecipient?.connectionId,
      recipientName: selectedRecipient?.connectionName
    });
    onOpenChange(false);
  };

  // One-time mode content
  const OneTimeContent = () => (
    <div className="space-y-5">
      {/* Mode Toggle */}
      {allowModeSwitch && (
        <SchedulingModeToggle
          mode={mode}
          onModeChange={setMode}
        />
      )}

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

      {/* Date Selection */}
      <div>
        <label className="text-sm font-semibold text-foreground mb-2 block">
          Delivery Date
        </label>
        <div className="bg-muted/30 rounded-lg py-3">
          <Picker
            value={pickerValue}
            onChange={(value) => setPickerValue(value as { month: string; day: string; year: string })}
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
        <p className="text-xs text-muted-foreground text-center mt-2">
          Gift will arrive on or before this date
        </p>

        {/* Holiday Conversion Banner */}
        <HolidayConversionBanner
          holidayLabel={detectedHoliday?.label || ''}
          visible={!!detectedHoliday && !holidayBannerDismissed}
          onConvert={handleHolidayConversion}
          onDismiss={() => setHolidayBannerDismissed(true)}
        />
      </div>

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
    </div>
  );

  // Footer buttons for one-time mode
  const OneTimeFooterButtons = ({ className }: { className?: string }) => (
    <div className={cn("flex gap-3", className)}>
      <Button
        variant="outline"
        className="flex-1 h-11 min-h-[44px]"
        onClick={() => onOpenChange(false)}
      >
        Cancel
      </Button>
      <Button
        className="flex-1 h-11 min-h-[44px] bg-gradient-to-r from-purple-600 to-sky-500 hover:from-purple-700 hover:to-sky-600 text-white"
        onClick={handleOneTimeSchedule}
      >
        Schedule Gift
      </Button>
    </div>
  );

  // Render recurring mode - embed AutoGiftSetupFlow
  if (mode === 'recurring') {
    return (
      <AutoGiftSetupFlow
        open={open}
        onOpenChange={onOpenChange}
        embedded={true}
        initialRecipient={selectedRecipient}
        onComplete={handleRecurringComplete}
        showModeToggle={allowModeSwitch}
        onModeChange={(newMode) => setMode(newMode as SchedulingMode)}
      />
    );
  }

  // Render one-time mode - responsive container
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

          <div className="p-4 overflow-y-auto">
            <OneTimeContent />
          </div>

          <DrawerFooter className="border-t pt-4">
            <OneTimeFooterButtons className="w-full" />
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Gift className="h-5 w-5" />
            Schedule Gift
          </DialogTitle>
        </DialogHeader>

        <OneTimeContent />

        <OneTimeFooterButtons className="pt-4" />
      </DialogContent>
    </Dialog>
  );
};

export default UnifiedGiftSchedulingModal;
