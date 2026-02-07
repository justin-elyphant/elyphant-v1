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
import { calculateNextBirthday, PRESET_HOLIDAYS, calculateHolidayDate, isKnownHoliday } from '@/constants/holidayDates';
import { unifiedPaymentService } from '@/services/payment/UnifiedPaymentService';
import { unifiedGiftManagementService } from '@/services/UnifiedGiftManagementService';
import SimpleRecipientSelector, { SelectedRecipient } from '@/components/marketplace/product-details/SimpleRecipientSelector';
import PresetHolidaySelector from './PresetHolidaySelector';
import RecurringToggleSection from './RecurringToggleSection';
import { DropdownDatePicker } from '@/components/ui/dropdown-date-picker';
import DeliveryTypeSelector, { DeliveryType } from './DeliveryTypeSelector';
import MultiEventSelector, { SelectedEvent } from '@/components/gifting/events/add-dialog/MultiEventSelector';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocalStorage } from '@/components/gifting/hooks/useLocalStorage';


// Product context for saving hints when creating recurring rules
export interface ProductContext {
  productId: string;
  title: string;
  brand?: string;
  category?: string;
  price: number;
  image: string;
}

// Product hints for AI gift suggestions (re-exported for backward compatibility)
export interface ProductHints {
  productId: string;
  title: string;
  brand?: string;
  category?: string;
  priceRange: [number, number];
  image: string;
}

export type SchedulingMode = 'one-time' | 'recurring';

// Editing rule data shape for pre-populating the form
export interface EditingRuleData {
  id: string;
  recipient_id?: string | null;
  pending_recipient_email?: string | null;
  date_type: string;
  budget_limit?: number;
  payment_method_id?: string;
  notification_preferences?: { days_before: number[]; email: boolean };
  auto_approve?: boolean;
  gift_message?: string;
  scheduled_date?: string;
  // Legacy fields from AutoGiftSetupFlow initialData format
  recipientId?: string;
  recipientName?: string;
  eventType?: string;
  budgetLimit?: number;
  selectedPaymentMethodId?: string;
  emailNotifications?: boolean;
  notificationDays?: number[];
  autoApprove?: boolean;
  giftMessage?: string;
}

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
  // Standalone mode (no product, rule-only)
  standaloneMode?: boolean;
  // Rule editing
  editingRule?: EditingRuleData | null;
  ruleId?: string;
  // Pre-select recipient
  initialRecipient?: SelectedRecipient | null;
  // Product hints for AI
  productHints?: ProductHints;
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
  onComplete,
  standaloneMode = false,
  editingRule,
  ruleId,
  initialRecipient,
  productHints: externalProductHints
}) => {
  const isMobile = useIsMobile(1024);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { addToCart, assignItemToRecipient } = useCart();
  const { createRule, updateRule, rules: existingRules, settings, updateSettings } = useAutoGifting();

  // Core state
  const [selectedRecipient, setSelectedRecipient] = useState<SelectedRecipient | null>(null);
  const [giftMessage, setGiftMessage] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Preset/Holiday selection (used in product mode)
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Delivery type coaching state (used in product mode)
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('holiday');
  const [deliveryTypeUserSet, setDeliveryTypeUserSet] = useState(false);

  // Recurring toggle state
  const [isRecurring, setIsRecurring] = useState(false);
  const [budget, setBudget] = useState(50);
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [autoApprove, setAutoApprove] = useState(false);
  const [notificationDays, setNotificationDays] = useState([7, 3, 1]);

  // Multi-event state (standalone mode only)
  const [selectedEvents, setSelectedEvents] = useState<SelectedEvent[]>([]);

  // Draft persistence for standalone mode
  const [savedDraft, setSavedDraft] = useLocalStorage('recurringGiftDraft', {
    selectedEvents: [] as SelectedEvent[],
    budget: 50,
    giftMessage: '',
    autoApprove: false,
    notificationDays: [7, 3, 1],
  });

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

  // Get the effective selected date (from picker or preset) - only for product mode
  const effectiveDate = useMemo(() => {
    if (standaloneMode) return null; // Standalone mode uses multi-event dates
    if (selectedDate) return selectedDate;
    return getPickerDate();
  }, [selectedDate, getPickerDate, standaloneMode]);

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

  // Determine the recipient's DOB string to pass to selectors
  const recipientDobForPresets = useMemo(() => {
    if (selectedRecipient?.type === 'self') return userDob || undefined;
    return selectedRecipient?.recipientDob;
  }, [selectedRecipient, userDob]);

  // Determine the recipient's important dates
  const recipientImportantDatesForPresets = useMemo(() => {
    if (selectedRecipient?.type === 'self') return [];
    return selectedRecipient?.recipientImportantDates || [];
  }, [selectedRecipient]);

  // Check if recipient has upcoming events within 60 days for smart default
  const hasUpcomingEvents = useMemo(() => {
    if (!selectedRecipient) return false;
    
    const now = new Date();
    const futureWindow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    
    if (recipientDobForPresets) {
      const birthday = calculateNextBirthday(recipientDobForPresets);
      if (birthday && birthday <= futureWindow) return true;
    }
    
    return recipientImportantDatesForPresets.some(date => {
      const nextDate = new Date(date.date);
      return nextDate <= futureWindow;
    });
  }, [recipientDobForPresets, recipientImportantDatesForPresets, selectedRecipient]);

  // Set initial delivery type when recipient changes - only if user hasn't explicitly chosen
  useEffect(() => {
    if (!standaloneMode && selectedRecipient && !deliveryTypeUserSet) {
      setDeliveryType(hasUpcomingEvents ? 'holiday' : 'specific');
    }
  }, [hasUpcomingEvents, selectedRecipient, deliveryTypeUserSet, standaloneMode]);

  // Check if recurring rule already exists for this recipient+occasion
  const hasExistingRule = useMemo(() => {
    if (standaloneMode) return false; // Standalone mode handles duplicates via batch service
    if (!selectedRecipient?.connectionId || !selectedPreset) return false;
    return existingRules.some(
      rule => rule.recipient_id === selectedRecipient.connectionId && 
              rule.date_type === selectedPreset &&
              rule.is_active
    );
  }, [existingRules, selectedRecipient, selectedPreset, standaloneMode]);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      // If editing, populate from editingRule
      if (editingRule) {
        const recipientId = editingRule.recipientId || editingRule.recipient_id;
        const recipientName = editingRule.recipientName;
        
        if (recipientId) {
          setSelectedRecipient({
            type: 'connection',
            connectionId: recipientId,
            connectionName: recipientName,
          });
        }
        
        setGiftMessage(editingRule.giftMessage || editingRule.gift_message || '');
        setBudget(editingRule.budgetLimit || editingRule.budget_limit || 50);
        setPaymentMethodId(editingRule.selectedPaymentMethodId || editingRule.payment_method_id || '');
        setAutoApprove(editingRule.autoApprove ?? editingRule.auto_approve ?? false);
        setNotificationDays(editingRule.notificationDays || editingRule.notification_preferences?.days_before || [7, 3, 1]);
        
        // For standalone editing, pre-populate the event
        if (standaloneMode) {
          const dateType = editingRule.eventType || editingRule.date_type;
          if (dateType) {
            setSelectedEvents([{ eventType: dateType }]);
          }
          setIsRecurring(true);
        } else {
          setIsRecurring(false);
        }
      } else {
        // Fresh form
        setGiftMessage('');
        setSelectedPreset(null);
        setSelectedDate(null);
        setDeliveryTypeUserSet(false);
        setPickerValue(getInitialPickerValues());
        
        if (standaloneMode) {
          // Restore draft in standalone mode
          setSelectedEvents(savedDraft.selectedEvents || []);
          setBudget(savedDraft.budget || 50);
          setGiftMessage(savedDraft.giftMessage || '');
          setAutoApprove(savedDraft.autoApprove ?? false);
          setNotificationDays(savedDraft.notificationDays || [7, 3, 1]);
          setIsRecurring(true); // Always recurring in standalone mode
        } else {
          setIsRecurring(false);
          setBudget(product?.price ? Math.round(product.price * 1.2) : 50);
          setSelectedEvents([]);
        }
        
        setPaymentMethodId('');

        // Pre-populate recipient
        if (initialRecipient && initialRecipient.type !== 'later') {
          setSelectedRecipient({
            type: initialRecipient.type || 'connection',
            connectionId: initialRecipient.connectionId,
            connectionName: initialRecipient.connectionName,
            shippingAddress: initialRecipient.shippingAddress,
            addressVerified: initialRecipient.addressVerified
          });
        } else if (existingRecipient) {
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
      
      // Auto-populate default payment method
      if (user) {
        unifiedPaymentService.getPaymentMethods().then(methods => {
          const defaultMethod = methods.find(m => m.is_default);
          if (defaultMethod && !editingRule?.payment_method_id && !editingRule?.selectedPaymentMethodId) {
            setPaymentMethodId(defaultMethod.id);
          }
        }).catch(err => console.warn('Could not fetch payment methods:', err));
      }

      // Sync autoApprove with global settings for new rules
      if (!editingRule && settings) {
        setAutoApprove(settings.auto_approve_gifts ?? false);
      }
    }
  }, [open, existingRecipient, product?.price, user, editingRule, initialRecipient, standaloneMode, settings]);

  // Save draft when standalone mode state changes
  useEffect(() => {
    if (standaloneMode && open && !editingRule) {
      setSavedDraft({
        selectedEvents,
        budget,
        giftMessage,
        autoApprove,
        notificationDays,
      });
    }
  }, [selectedEvents, budget, giftMessage, autoApprove, notificationDays, standaloneMode, open, editingRule]);

  // Handle preset selection - updates picker to match
  const handlePresetSelect = (presetKey: string, date: Date) => {
    setSelectedPreset(presetKey);
    setSelectedDate(date);
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
    setSelectedDate(null);
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

  // Validate date meets minimum lead time (product mode only)
  const validateDate = (): boolean => {
    if (standaloneMode) return true; // Standalone uses event dates
    
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
    if (externalProductHints) return externalProductHints;
    
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

  // Standalone mode submit handler
  const handleStandaloneSubmit = async () => {
    if (!selectedRecipient?.connectionId) {
      toast.error('Please select a recipient');
      return;
    }

    if (selectedEvents.length === 0) {
      toast.error('Please select at least one gift occasion');
      return;
    }

    // Validate holiday events have specific holiday selected
    const hasIncompleteHoliday = selectedEvents.some(
      e => e.eventType === 'holiday' && !e.specificHoliday
    );
    if (hasIncompleteHoliday) {
      toast.error('Please select a specific holiday for all holiday events');
      return;
    }

    // Validate "Just Because" events have dates
    const hasIncompleteDate = selectedEvents.some(
      e => e.eventType === 'other' && !e.customDate
    );
    if (hasIncompleteDate) {
      toast.error("Please select dates for all 'Just Because' gifts");
      return;
    }

    if (!paymentMethodId) {
      toast.error('Please select a payment method for recurring gifts');
      return;
    }

    setIsSubmitting(true);

    try {
      // Build product hints
      const hints = buildProductHints();

      // Calculate scheduled dates for each event
      const rulesToCreate = selectedEvents.map(event => {
        let scheduledDate: string | null = null;

        if (event.eventType === 'other' && event.customDate) {
          scheduledDate = event.customDate.toISOString().split('T')[0];
        } else if (event.eventType === 'birthday') {
          const dob = recipientDobForPresets;
          if (dob) {
            const bd = calculateNextBirthday(dob);
            scheduledDate = bd ? bd.toISOString().split('T')[0] : null;
          }
        } else if (event.eventType === 'holiday' && event.specificHoliday) {
          scheduledDate = calculateHolidayDate(event.specificHoliday);
        } else if (isKnownHoliday(event.eventType)) {
          scheduledDate = calculateHolidayDate(event.eventType);
        } else if (event.calculatedDate) {
          scheduledDate = event.calculatedDate;
        }

        return {
          user_id: '',
          recipient_id: selectedRecipient.connectionId,
          pending_recipient_email: null as string | null,
          date_type: event.eventType === 'holiday' ? event.specificHoliday! : event.eventType,
          scheduled_date: scheduledDate,
          is_active: true,
          budget_limit: budget,
          notification_preferences: {
            enabled: true,
            days_before: notificationDays,
            email: true,
            push: false,
          },
          gift_selection_criteria: {
            source: hints ? 'specific' as const : 'both' as const,
            specific_product_id: hints?.productId,
            preferred_brands: hints?.brand ? [hints.brand] : [],
            categories: hints?.category ? [hints.category] : [],
            max_price: budget,
            min_price: Math.max(1, budget * 0.1),
            exclude_items: [],
            original_product_reference: hints ? {
              title: hints.title,
              image: hints.image,
              price: hints.priceRange[0]
            } : undefined,
          },
          payment_method_id: paymentMethodId,
          gift_message: giftMessage,
        };
      });

      if (ruleId) {
        // Update existing rule
        toast.info('Updating recurring gift rule...', { duration: 2000 });
        await updateRule(ruleId, rulesToCreate[0]);
        toast.success('Recurring gift rule updated!');
      } else {
        // Batch create
        toast.info(`Creating ${rulesToCreate.length} recurring gift rules...`, { duration: 2000 });
        const recipientIdentifier = rulesToCreate[0].recipient_id || '';
        await unifiedGiftManagementService.createBatchRulesForRecipient(
          recipientIdentifier,
          rulesToCreate
        );
        toast.success('Recurring gifts set up!', {
          description: `${rulesToCreate.length} occasion${rulesToCreate.length > 1 ? 's' : ''} configured`
        });
      }

      // Update global auto-approve setting if changed
      if (settings) {
        await updateSettings({ auto_approve_gifts: autoApprove });
      }

      // Clear draft
      localStorage.removeItem('recurringGiftDraft');

      triggerHapticFeedback('success');

      onComplete?.({
        mode: 'recurring',
        recipientId: selectedRecipient.connectionId,
        recipientName: selectedRecipient.connectionName,
        giftMessage,
        ruleId: ruleId || undefined,
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Error in recurring gift setup:', error);
      const e: any = error;
      const errorMessage = e?.message || e?.error?.message || 'Unknown error occurred';
      toast.error('Failed to create recurring gift rules', {
        description: errorMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Product mode submit handler (original logic)
  const handleProductSubmit = async () => {
    if (!validateDate()) return;
    if (!effectiveDate) return;

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

      // Step 1: Add to cart (if product exists)
      if (product) {
        const cartProduct = {
          ...product,
          product_id: effectiveProductId,
          image: product.image,
          images: product.images,
          variationText
        };
        addToCart(cartProduct);

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
        const productHintsData = buildProductHints();
        
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
            categories: productHintsData?.category ? [productHintsData.category] : [],
            max_price: budget,
            exclude_items: [],
            preferred_brands: productHintsData?.brand ? [productHintsData.brand] : []
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

  // Unified submit dispatcher
  const handleSchedule = () => {
    if (standaloneMode) {
      handleStandaloneSubmit();
    } else {
      handleProductSubmit();
    }
  };

  // Get dynamic title
  const getTitle = () => {
    if (standaloneMode) {
      return ruleId ? 'Edit Recurring Gift' : 'Set Up Recurring Gift';
    }
    return 'Schedule Gift';
  };

  // Get submit button text
  const getSubmitButtonText = () => {
    if (isSubmitting) return standaloneMode ? 'Saving...' : 'Scheduling...';
    if (standaloneMode) {
      return ruleId ? 'Save Changes' : 'Create Recurring Rule';
    }
    if (isRecurring && !hasExistingRule) return 'Schedule & Set Recurring';
    return 'Schedule Gift';
  };

  // Check if submit is disabled
  const isSubmitDisabled = () => {
    if (isSubmitting) return true;
    if (standaloneMode) {
      return !selectedRecipient?.connectionId || selectedEvents.length === 0 || !paymentMethodId || budget < 5;
    }
    return !effectiveDate;
  };

  // Modal content
  const modalContent = (
    <div className="space-y-5">
      {/* Recipient Selection - First */}
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

      {/* Date Section - Different based on mode */}
      {standaloneMode ? (
        /* Multi-Event Selector for standalone mode */
        <div className="space-y-3">
          <MultiEventSelector
            value={selectedEvents}
            onChange={setSelectedEvents}
            recipientDob={recipientDobForPresets}
            recipientImportantDates={recipientImportantDatesForPresets}
            recipientName={selectedRecipient?.type === 'connection' ? selectedRecipient.connectionName : undefined}
          />
        </div>
      ) : (
        /* Delivery Date Section for product mode */
        <div className="space-y-3">
          <label className="text-sm font-semibold text-foreground block">
            When should this gift arrive?
          </label>
          
          {/* Step 1: Coaching Question */}
          <DeliveryTypeSelector
            selectedType={deliveryType}
            onTypeChange={(type) => {
              setDeliveryType(type);
              setDeliveryTypeUserSet(true);
              if (type === 'specific') {
                setSelectedPreset(null);
                setSelectedDate(null);
              }
            }}
          />
          
          {/* Step 2: Conditional content based on selection */}
          <AnimatePresence mode="wait">
            {deliveryType === 'holiday' ? (
              <motion.div
                key="holiday-flow"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                <PresetHolidaySelector
                  selectedPreset={selectedPreset}
                  recipientDob={recipientDobForPresets}
                  recipientName={selectedRecipient?.type === 'connection' ? selectedRecipient.connectionName : undefined}
                  recipientImportantDates={recipientImportantDatesForPresets}
                  onPresetSelect={handlePresetSelect}
                  onClear={handlePresetClear}
                />
                
                {!selectedPreset && (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Don't see your date? Switch to{' '}
                    <button 
                      type="button"
                      onClick={() => setDeliveryType('specific')}
                      className="text-primary underline underline-offset-2 font-medium"
                    >
                      Specific Date
                    </button>
                  </p>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="specific-flow"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="bg-muted/30 rounded-lg py-3 px-2">
                  {isMobile ? (
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
                  ) : (
                    <DropdownDatePicker
                      value={pickerValue}
                      onChange={handlePickerChange}
                    />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Selected Date Preview */}
          {effectiveDate && (deliveryType === 'specific' || selectedPreset) && (
            <p className="text-xs text-muted-foreground text-center">
              Gift will arrive on or before <span className="font-medium text-foreground">{format(effectiveDate, 'PPP')}</span>
            </p>
          )}
        </div>
      )}

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

      {/* Recurring Settings */}
      {standaloneMode ? (
        /* In standalone mode, show recurring settings inline (always expanded, no toggle) */
        <RecurringToggleSection
          isRecurring={true}
          onToggle={() => {}} // No-op, always on
          budget={budget}
          onBudgetChange={setBudget}
          paymentMethodId={paymentMethodId}
          onPaymentMethodChange={setPaymentMethodId}
          autoApprove={autoApprove}
          onAutoApproveChange={setAutoApprove}
          notificationDays={notificationDays}
          onNotificationDaysChange={setNotificationDays}
          className="[&>hr]:hidden" // Hide the separator since we already have one
        />
      ) : (
        /* In product mode, show toggle only when conditions are met */
        <>
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
        </>
      )}
    </div>
  );

  // Footer buttons
  const renderFooterButtons = (className?: string) => (
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
        disabled={isSubmitDisabled()}
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
                {getTitle()}
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

          <div className="p-4 overflow-y-auto flex-1 ios-smooth-scroll">
            {modalContent}
          </div>

          <DrawerFooter className="border-t pt-4">
            {renderFooterButtons("w-full")}
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
            {getTitle()}
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 py-2">
          {modalContent}
        </div>

        <div className="flex-shrink-0 border-t pt-4 mt-2">
          {renderFooterButtons()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UnifiedGiftSchedulingModal;
