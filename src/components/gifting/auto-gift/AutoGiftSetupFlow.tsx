import React, { useState, useEffect } from "react";
import { useLocalStorage } from "@/components/gifting/hooks/useLocalStorage";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { 
  Gift, DollarSign, Calendar, Users, Sparkles, 
  CheckCircle, ArrowRight, Bell, CreditCard, Ruler
} from "lucide-react";
import { useAutoGifting } from "@/hooks/useAutoGifting";
import { useEnhancedConnections } from "@/hooks/profile/useEnhancedConnections";
import { toast } from "sonner";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { RecipientSearchCombobox } from "./RecipientSearchCombobox";
import { calculateHolidayDate, isKnownHoliday } from "@/constants/holidayDates";
import SmartHolidayInfo from "./SmartHolidayInfo";
import UnifiedPaymentMethodManager from "@/components/payments/UnifiedPaymentMethodManager";
import MultiEventSelector, { SelectedEvent } from "@/components/gifting/events/add-dialog/MultiEventSelector";
import { unifiedGiftManagementService } from "@/services/UnifiedGiftManagementService";
import AddressVerificationWarning from "./AddressVerificationWarning";
import { triggerHapticFeedback } from "@/utils/haptics";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import SchedulingModeToggle from "@/components/gifting/unified/SchedulingModeToggle";
import { SelectedRecipient } from "@/components/marketplace/product-details/SimpleRecipientSelector";

// Product hints for AI gift suggestions
export interface ProductHints {
  productId: string;
  title: string;
  brand?: string;
  category?: string;
  priceRange: [number, number];
  image: string;
}

interface AutoGiftSetupFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId?: string;
  eventType?: string;
  recipientId?: string;
  initialData?: any; // For editing existing rules
  ruleId?: string; // For updating existing rules
  onRequestEditRule?: (rule: any) => void; // Callback to request editing a different rule
  // Embedded mode props
  embedded?: boolean;
  initialRecipient?: SelectedRecipient | null;
  onComplete?: (ruleData?: { dateType?: string; scheduledDate?: string }) => void;
  showModeToggle?: boolean;
  onModeChange?: (mode: string) => void;
  // Product context for AI hints
  productHints?: ProductHints;
}

interface SetupStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const AutoGiftSetupFlow: React.FC<AutoGiftSetupFlowProps> = ({
  open,
  onOpenChange,
  eventId,
  eventType,
  recipientId,
  initialData,
  ruleId,
  onRequestEditRule,
  embedded = false,
  initialRecipient,
  onComplete,
  showModeToggle = false,
  onModeChange,
  productHints
}) => {
  // Component initialization
  const { createRule, updateRule, settings, updateSettings } = useAutoGifting();
  const { connections, pendingInvitations, sentRequests, fetchConnections } = useEnhancedConnections();
  const { profile } = useProfile();
  // Get user sizes from profile metadata (cast for JSONB field access)
  const userSizes = (profile as any)?.metadata?.sizes || null;
  const isMobile = useIsMobile();
  
  // When embedded with initialRecipient, start at step 1 (Budget & Payment)
  const getInitialStep = () => {
    if (embedded && initialRecipient && initialRecipient.type !== 'later' && initialRecipient.connectionId) {
      return 1; // Skip recipient selection, start at budget
    }
    return 0;
  };
  
  const [currentStep, setCurrentStep] = useState(getInitialStep);
  const [isLoading, setIsLoading] = useState(false);
  
  // Ref for the scrollable container
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useLocalStorage('autoGiftDraft', {
    recipientId: recipientId || "",
    recipientName: undefined as string | undefined,
    relationshipType: undefined as string | undefined,
    recipientDob: undefined as string | undefined, // MM-DD format for birthday calculation
    selectedEvents: [] as SelectedEvent[],
    eventType: eventType || "", // Keep for backward compatibility
    specificHoliday: "",
    calculatedDate: null as string | null,
    selectedDate: undefined as Date | undefined,
    budgetLimit: settings?.default_budget_limit || 50,
    autoApprove: false,
    emailNotifications: true,
    notificationDays: [7, 3, 1],
    giftMessage: "",
    selectedPaymentMethodId: ""
  });

  // Initialize from embedded recipient
  useEffect(() => {
    if (embedded && initialRecipient && initialRecipient.type !== 'later') {
      setFormData(prev => ({
        ...prev,
        recipientId: initialRecipient.connectionId || '',
        recipientName: initialRecipient.connectionName
      }));
    }
  }, [embedded, initialRecipient]);

  // Helper to calculate next birthday from MM-DD format
  const calculateNextBirthday = (dobMMDD: string | undefined): string | null => {
    if (!dobMMDD || dobMMDD.length < 5) return null;
    const [month, day] = dobMMDD.split('-').map(Number);
    if (!month || !day) return null;
    const now = new Date();
    const currentYear = now.getFullYear();
    const thisYearBirthday = new Date(currentYear, month - 1, day);
    const birthdayToUse = thisYearBirthday >= now 
      ? thisYearBirthday 
      : new Date(currentYear + 1, month - 1, day);
    return birthdayToUse.toISOString().split('T')[0];
  };

  const steps: SetupStep[] = [
    {
      id: "recipient",
      title: "Choose Recipient",
      description: "Select who you want to set up recurring gifts for",
      icon: Users
    },
    {
      id: "budget",
      title: "Budget & Payment",
      description: "Set your budget and payment method for automatic gifts",
      icon: DollarSign
    },
    {
      id: "notifications",
      title: "Notifications & Approval",
      description: "Set up notifications and approval preferences",
      icon: Bell
    }
  ];

  useEffect(() => {
    console.log('🔍 AutoGiftSetupFlow - Props received:', { recipientId, eventType, initialData, ruleId, embedded });
    
    // Check if we have a saved draft and show notification
    const existingDraft = localStorage.getItem('autoGiftDraft');
    if (existingDraft && open && !initialData && !embedded) {
      try {
        const parsedDraft = JSON.parse(existingDraft);
        // Only show toast if there's meaningful data in the draft
        if (parsedDraft.recipientId || parsedDraft.eventType || parsedDraft.giftMessage) {
          toast.info("Draft restored", {
            description: "Your previous setup has been restored"
          });
        }
      } catch (error) {
        console.error('Error parsing draft:', error);
      }
    }
    
    if (recipientId) setFormData(prev => ({ ...prev, recipientId }));
    if (eventType) setFormData(prev => ({ ...prev, eventType }));
    
    // Populate form with initial data for editing OR pre-population from recipient events
    if (initialData) {
      console.log('🔍 AutoGiftSetupFlow - Populating form with initialData:', initialData);
      
      // Show confirmation that data was pre-filled
      if (initialData.recipientName && open) {
        toast.success(`Recurring gift setup opened for ${initialData.recipientName}`, {
          description: `Event details for ${initialData.eventType} have been pre-filled`
        });
      }
      
      setFormData(prev => {
        const newData = {
          ...prev,
          recipientId: initialData.recipientId || prev.recipientId,
          eventType: initialData.eventType || prev.eventType,
          budgetLimit: initialData.budgetLimit || prev.budgetLimit,
          selectedPaymentMethodId: initialData.selectedPaymentMethodId || prev.selectedPaymentMethodId,
          emailNotifications: initialData.emailNotifications ?? prev.emailNotifications,
          notificationDays: initialData.notificationDays || prev.notificationDays,
          autoApprove: initialData.autoApprove ?? prev.autoApprove,
          giftMessage: initialData.giftMessage || prev.giftMessage,
          // If eventDate is provided, calculate the appropriate date for birthday/anniversary
          selectedDate: initialData.eventDate && initialData.eventType === 'other' ? 
            new Date(initialData.eventDate) : prev.selectedDate
        };
        return newData;
      });
    }
  }, [recipientId, eventType, initialData, ruleId, open, embedded]);

  // Scroll to top when step changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      triggerHapticFeedback('selection');
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      triggerHapticFeedback('light');
      setCurrentStep(currentStep - 1);
    } else if (embedded && onModeChange) {
      // If at step 0 in embedded mode, switch back to one-time
      onModeChange('one-time');
    }
  };

  const handleSubmit = async () => {
    // Phase 1: Input validation with detailed feedback
    if (!formData.recipientId) {
      toast.error("Please select a recipient");
      return;
    }

    if (formData.selectedEvents.length === 0) {
      toast.error("Please select at least one gift occasion");
      return;
    }

    // Validate holiday events have specific holiday selected
    const hasIncompleteHoliday = formData.selectedEvents.some(
      e => e.eventType === "holiday" && !e.specificHoliday
    );
    if (hasIncompleteHoliday) {
      toast.error("Please select a specific holiday for all holiday events");
      return;
    }

    // Validate "Just Because" events have dates
    const hasIncompleteDate = formData.selectedEvents.some(
      e => e.eventType === "other" && !e.customDate
    );
    if (hasIncompleteDate) {
      toast.error("Please select dates for all 'Just Because' gifts");
      return;
    }

    if (!formData.selectedPaymentMethodId) {
      toast.error("Please select a payment method for recurring gifts");
      return;
    }

    setIsLoading(true);
    
    // Normalize eventId (strip special- prefix and validate UUID)
    const normalizeUuid = (val?: string | null) => {
      if (!val) return null;
      const stripped = val.startsWith('special-') ? val.slice(8) : val;
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(stripped) ? stripped : null;
    };
    const normalizedEventId = normalizeUuid(eventId || null);

    try {
      // Phase 2: Setup initiation with progress feedback
      toast.info("Setting up recurring gifts...", { duration: 2000 });

      // Find the selected recipient from both accepted connections and pending invitations
      const allConnections = [...connections, ...pendingInvitations];
      
      // Try to find connection by ID first, then by email if recipientId looks like an email
      const isEmail = formData.recipientId.includes('@');
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(formData.recipientId);
      
      let selectedConnection = allConnections.find(conn => {
        if (isEmail) {
          return conn.pending_recipient_email === formData.recipientId || conn.profile_email === formData.recipientId;
        } else if (isUuid) {
          return conn.id === formData.recipientId || conn.display_user_id === formData.recipientId || conn.connected_user_id === formData.recipientId;
        }
        return false;
      });

      // AUTO-CREATE CONNECTION IF MISSING
      if (isEmail && !selectedConnection) {
        console.log('🔄 [AUTO-CREATE] Connection not found for email, creating pending connection:', formData.recipientId);
        
        try {
          toast.info("Creating recipient connection...", { duration: 2000 });
          
          // Use the recipient name from form data or extract from email
          const recipientName = formData.recipientName || formData.recipientId.split('@')[0];
          
          const newConnection = await unifiedGiftManagementService.createPendingConnection(
            formData.recipientId,  // email
            recipientName,
            formData.relationshipType || 'friend',
            null,  // No shipping address yet
            null,  // No birthday
            null   // No relationship context
          );
          
          console.log('✅ [AUTO-CREATE] Successfully created pending connection:', newConnection);
          
          // Create a compatible connection object for the rest of the flow
          selectedConnection = {
            id: newConnection.id,
            status: 'pending_invitation',
            pending_recipient_email: formData.recipientId,
            pending_recipient_name: recipientName,
            display_user_id: null,
            connected_user_id: null,
            profile_email: null
          } as any;
          
          toast.success("Recipient connection created!");
        } catch (createError) {
          console.error('❌ [AUTO-CREATE] Failed to create pending connection:', createError);
          toast.error("Failed to create recipient connection. Please try again.");
          setIsLoading(false);
          return;
        }
      }

      // Determine invitation vs accepted and resolve identifiers safely
      const isPendingInvitation = (selectedConnection?.status === 'pending_invitation') || (isEmail && !selectedConnection);
      const emailFromInitial = initialData?.recipientEmail as string | undefined;

      // CRITICAL: For pending invitations, recipient_id MUST be null
      const actualRecipientId = isPendingInvitation
        ? null
        : (selectedConnection?.connected_user_id || selectedConnection?.display_user_id || null);

      const pendingEmail = isPendingInvitation
        ? (selectedConnection?.pending_recipient_email || (isEmail ? formData.recipientId : emailFromInitial))
        : null;

      console.log('🔍 Recurring gift setup - Enhanced connection resolution:', {
        formDataRecipientId: formData.recipientId,
        isEmail,
        isUuid,
        hasSelectedConnection: !!selectedConnection,
        connectionId: selectedConnection?.id,
        connectionStatus: selectedConnection?.status,
        isPendingInvitation,
        actualRecipientId,
        pendingEmail,
      });

      // Validation: Ensure data integrity
      if (isPendingInvitation) {
        if (actualRecipientId !== null) {
          console.error('❌ CRITICAL: recipient_id should be null for pending invitations but got:', actualRecipientId);
          toast.error('Internal error: Invalid recipient configuration');
          setIsLoading(false);
          return;
        }
        if (!pendingEmail) {
          console.error('❌ CRITICAL: pending_recipient_email is required for pending invitations');
          toast.error('Internal error: Missing recipient email');
          setIsLoading(false);
          return;
        }
      } else {
        if (!actualRecipientId) {
          console.error('❌ CRITICAL: recipient_id is required for accepted connections');
          toast.error('Internal error: Missing recipient ID');
          setIsLoading(false);
          return;
        }
      }
      
      // Create rule data for each selected event with proper scheduled_date calculation
      const rulesToCreate = formData.selectedEvents.map(event => {
        let scheduledDate: string | null = null;
        
        // Calculate scheduled_date based on event type
        if (event.eventType === "other" && event.customDate) {
          scheduledDate = event.customDate.toISOString().split('T')[0];
        } else if (event.eventType === "birthday") {
          // Use recipient's DOB to calculate next birthday
          scheduledDate = calculateNextBirthday(formData.recipientDob);
          console.log(`📅 Birthday scheduled_date calculated: ${scheduledDate} from DOB: ${formData.recipientDob}`);
        } else if (event.eventType === "holiday" && event.specificHoliday) {
          // Use holiday date calculator
          scheduledDate = calculateHolidayDate(event.specificHoliday);
          console.log(`📅 Holiday scheduled_date calculated: ${scheduledDate} for ${event.specificHoliday}`);
        } else if (isKnownHoliday(event.eventType)) {
          // date_type is a known holiday (e.g., "christmas", "valentine")
          scheduledDate = calculateHolidayDate(event.eventType);
          console.log(`📅 Known holiday scheduled_date: ${scheduledDate} for ${event.eventType}`);
        }
        
        return {
          user_id: "", // Will be set by service
          recipient_id: actualRecipientId,
          pending_recipient_email: pendingEmail,
          date_type: event.eventType === "holiday" ? event.specificHoliday! : event.eventType,
          scheduled_date: scheduledDate,
          event_id: normalizedEventId,
          is_active: true,
          budget_limit: formData.budgetLimit,
          notification_preferences: {
            enabled: formData.emailNotifications,
            days_before: formData.notificationDays,
            email: formData.emailNotifications,
            push: false,
          },
          gift_selection_criteria: {
            source: productHints ? "specific" as const : "both" as const,
            specific_product_id: productHints?.productId,
            preferred_brands: productHints?.brand ? [productHints.brand] : [],
            categories: productHints?.category ? [productHints.category] : [],
            max_price: formData.budgetLimit,
            min_price: Math.max(1, formData.budgetLimit * 0.1),
            exclude_items: [],
            // Original product as reference for AI suggestions
            original_product_reference: productHints ? {
              title: productHints.title,
              image: productHints.image,
              price: productHints.priceRange[0]
            } : undefined,
          },
          payment_method_id: formData.selectedPaymentMethodId,
          gift_message: formData.giftMessage,
        };
      });

      // Phase 3: Batch rule creation with enhanced feedback
      if (ruleId) {
        // For editing, only update the first rule (legacy single-event mode)
        toast.info("Updating recurring gift rule...", { duration: 2000 });
        await updateRule(ruleId, rulesToCreate[0]);
        toast.success("Recurring gift rule updated successfully!");
      } else {
        toast.info(`Creating ${rulesToCreate.length} recurring gift rules...`, { duration: 2000 });
        
        // Use batch creation service
        const recipientIdentifier = rulesToCreate[0].recipient_id || rulesToCreate[0].pending_recipient_email || '';
        await unifiedGiftManagementService.createBatchRulesForRecipient(
          recipientIdentifier,
          rulesToCreate
        );
      }

      // Phase 4: Settings update with confirmation
      if (settings) {
        await updateSettings({
          auto_approve_gifts: formData.autoApprove
        });
        
        if (formData.autoApprove) {
          toast.success("Auto-approval enabled", {
            description: "Gifts within budget will be automatically approved"
          });
        }
      }

      // Phase 5: Successful completion
      toast.success("Setup completed successfully!", {
        description: `${rulesToCreate.length} recurring gift events configured`
      });
      
      // Clear the draft after successful completion
      localStorage.removeItem('autoGiftDraft');
      console.log('✅ Recurring gift draft cleared after successful setup');
      
      // Call onComplete callback for embedded mode with rule data for "Buy + Recur" flow
      if (embedded && onComplete) {
        // Get the first rule's date info for cart assignment
        const firstRule = rulesToCreate[0];
        onComplete({
          dateType: firstRule?.date_type,
          scheduledDate: firstRule?.scheduled_date || undefined
        });
      } else {
        onOpenChange(false);
      }
      setCurrentStep(0);
      
    } catch (error) {
      console.error("Error in recurring gift setup:", error);
      
      const e: any = error;
      const errorMessage = e?.message || e?.error?.message || e?.hint || e?.code || 'Unknown error occurred';
      
      if (String(errorMessage).toLowerCase().includes("rate limit")) {
        toast.error("Setup rate limit exceeded", {
          description: "Please wait a moment before creating another rule"
        });
      } else if (String(errorMessage).toLowerCase().includes("validation") || String(errorMessage).toLowerCase().includes("recipient")) {
        toast.error("Setup validation failed", {
          description: errorMessage
        });
      } else {
        toast.error("Failed to create recurring gift rules", {
          description: errorMessage
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentStepIcon = () => {
    const Icon = steps[currentStep].icon;
    return <Icon className="h-6 w-6" />;
  };

  // Content for the wizard
  const WizardContent = () => (
    <div 
      ref={scrollContainerRef}
      className="max-h-[calc(90vh-120px)] overflow-y-auto overflow-x-hidden w-full max-w-full mobile-container ios-smooth-scroll pb-safe-bottom"
    >
      <DialogHeader className="pb-0">
        <DialogTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          {ruleId ? 'Edit Recurring Gift Rule' : 'Set Up Recurring Gifts'}
        </DialogTitle>
      </DialogHeader>

      {/* Mode Toggle (when embedded) */}
      {showModeToggle && (
        <div className="pt-4 px-1">
          <SchedulingModeToggle
            mode="recurring"
            onModeChange={(mode) => onModeChange?.(mode)}
          />
        </div>
      )}

      {/* Progress Steps */}
      <Tabs value={currentStep.toString()} className="w-full mt-4">
        <TabsList className="grid w-full grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <TabsTrigger 
                key={step.id} 
                value={index.toString()}
                className="flex items-center gap-2"
                disabled={index > currentStep}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{step.title}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Step 1: Recipient Selection */}
        <TabsContent value="0" className="space-y-4 pb-32 overflow-x-hidden">
          {initialData?.recipientName && (
            <div className="p-3 bg-muted border border-border rounded-lg">
              <div className="flex items-center gap-2 text-foreground">
                <CheckCircle className="h-4 w-4 text-blue-500" />
                <span className="font-medium">Event Details Pre-filled</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Setting up recurring gifts for {initialData.recipientName}'s {initialData.eventType}
                {initialData.eventDate && ` on ${new Date(initialData.eventDate).toLocaleDateString()}`}
              </p>
            </div>
          )}
          
          {embedded && initialRecipient && initialRecipient.type !== 'later' && (
            <div className="p-3 bg-muted border border-border rounded-lg">
              <div className="flex items-center gap-2 text-foreground">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="font-medium">Recipient Selected</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Setting up recurring gifts for {initialRecipient.connectionName || 'selected recipient'}
              </p>
            </div>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Choose Recipient & Event
              </CardTitle>
              <CardDescription>
                Select who you want to set up recurring gifts for
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="recipient" className="flex items-center gap-2">
                  Recipient
                  {initialData?.recipientName && (
                    <Badge variant="outline" className="bg-muted text-muted-foreground border-border">
                      Pre-filled
                    </Badge>
                  )}
                  {formData.recipientId && pendingInvitations.some(p => p.display_user_id === formData.recipientId || p.id === formData.recipientId) && (
                    <Badge variant="outline" className="bg-muted text-muted-foreground border-border">
                      Pending Invitation
                    </Badge>
                  )}
                </Label>
                 <RecipientSearchCombobox
                  value={formData.recipientId}
                  onChange={({ recipientId, recipientName, relationshipType, recipientDob }) => 
                    setFormData(prev => ({ 
                      ...prev, 
                      recipientId,
                      recipientName,
                      relationshipType: relationshipType || prev.relationshipType,
                      recipientDob: recipientDob || prev.recipientDob
                    }))
                  }
                  connections={connections}
                  pendingInvitations={pendingInvitations}
                  sentRequests={sentRequests}
                  onNewRecipientCreate={async (recipient) => {
                    setFormData(prev => ({ 
                      ...prev, 
                      recipientId: recipient.id,
                      recipientName: recipient.name,
                      relationshipType: recipient.relationship_type || 'friend'
                    }));
                    toast.success(`Added ${recipient.name} as recipient`);
                    
                    // Refresh connections to include the newly created recipient
                    await fetchConnections();
                    
                    // Scroll back to top so user can verify the recipient was added
                    if (scrollContainerRef.current) {
                      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  onEditExistingRule={(rule) => {
                    if (onRequestEditRule) {
                      onRequestEditRule(rule);
                    }
                  }}
                />
                {formData.recipientId && pendingInvitations.some(p => p.display_user_id === formData.recipientId || p.id === formData.recipientId) && (
                  <p className="text-sm text-muted-foreground mt-2">
                    This gift will be sent once {pendingInvitations.find(p => p.display_user_id === formData.recipientId || p.id === formData.recipientId)?.pending_recipient_name} accepts the invitation and provides their address.
                  </p>
                )}
              </div>

              {/* Address Verification Status */}
              {formData.recipientId && (
                <AddressVerificationWarning
                  recipientId={formData.recipientId}
                  connections={connections}
                  pendingInvitations={pendingInvitations}
                  sentRequests={sentRequests}
                />
              )}

              <MultiEventSelector
                value={formData.selectedEvents}
                onChange={(events) => setFormData(prev => ({ ...prev, selectedEvents: events }))}
                recipientDob={formData.recipientDob}
                recipientImportantDates={
                  // Get important_dates from selected connection
                  (() => {
                    const allConnections = [...connections, ...pendingInvitations];
                    const conn = allConnections.find(c => 
                      c.id === formData.recipientId || 
                      c.display_user_id === formData.recipientId ||
                      c.connected_user_id === formData.recipientId
                    );
                    return (conn as any)?.profile_important_dates || [];
                  })()
                }
                recipientName={formData.recipientName}
              />

              {formData.eventType === "holiday" && formData.specificHoliday && (
                <SmartHolidayInfo 
                  holidayType={formData.specificHoliday}
                  recipientName={
                    connections.find(c => c.id === formData.recipientId)?.profile_name ||
                    pendingInvitations.find(c => c.id === formData.recipientId)?.pending_recipient_name
                  }
                />
              )}

              {formData.eventType === "holiday" && formData.calculatedDate && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Recurring gift will trigger for: {new Date(formData.calculatedDate).toLocaleDateString()}
                  </p>
                </div>
              )}

              {formData.eventType === "other" && formData.selectedDate && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Gift will be delivered on: {formData.selectedDate.toLocaleDateString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Step 2: Budget & Payment */}
        <TabsContent value="1" className="space-y-4 pb-32 overflow-x-hidden">
          {formData.recipientId && pendingInvitations.some(p => p.display_user_id === formData.recipientId || p.id === formData.recipientId) && (
            <div className="p-3 bg-muted border border-border rounded-lg">
              <div className="flex items-center gap-2 text-foreground">
                <Bell className="h-4 w-4 text-amber-500" />
                <span className="font-medium">Pending Invitation</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Recurring gifts will activate once {pendingInvitations.find(p => p.display_user_id === formData.recipientId || p.id === formData.recipientId)?.pending_recipient_name} accepts your connection and provides their shipping address.
              </p>
            </div>
          )}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Budget & Payment Method
              </CardTitle>
              <CardDescription>
                Set your budget and payment method. Our AI will automatically select the best gifts by checking wishlist items first, then preferences, then smart recommendations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <p className="font-medium text-sm">Smart Gift Selection</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Our system automatically finds the perfect gift by checking: 1) Recipient's wishlist items 2) Their preferences and interests 3) AI-powered smart recommendations if needed
                </p>
              </div>

              {/* Show user sizes if available */}
              {userSizes && (
                <div className="p-4 border rounded-lg bg-muted/30">
                  <p className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Ruler className="h-4 w-4" />
                    Your Saved Sizes (for Nicole AI)
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                    {userSizes.tops && (
                      <div>
                        <span className="font-medium text-foreground">Tops:</span> {userSizes.tops}
                      </div>
                    )}
                    {userSizes.bottoms && (
                      <div>
                        <span className="font-medium text-foreground">Bottoms:</span> {userSizes.bottoms}
                      </div>
                    )}
                    {userSizes.shoes && (
                      <div>
                        <span className="font-medium text-foreground">Shoes:</span> {userSizes.shoes}
                      </div>
                    )}
                    {userSizes.ring && (
                      <div>
                        <span className="font-medium text-foreground">Ring:</span> {userSizes.ring}
                      </div>
                    )}
                    {userSizes.fit_preference && (
                      <div className="col-span-2">
                        <span className="font-medium text-foreground">Fit:</span> {userSizes.fit_preference}
                      </div>
                    )}
                  </div>
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="text-xs p-0 h-auto mt-3"
                    onClick={() => window.open('/settings?tab=sizes', '_blank')}
                  >
                    Update sizes →
                  </Button>
                </div>
              )}

              <div>
                <Label htmlFor="budget">Budget Limit ($)</Label>
                <Input
                  id="budget"
                  type="number"
                  min="5"
                  max="1000"
                  value={formData.budgetLimit}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    budgetLimit: Number(e.target.value) 
                  }))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Recommended: $25-100 depending on your relationship
                </p>
              </div>

              <Separator />

              <div>
                <Label className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Payment Method
                </Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Select which payment method to use for recurring gift purchases
                </p>
                <UnifiedPaymentMethodManager
                  mode="selection"
                  onSelectMethod={(method) => 
                    setFormData(prev => ({ ...prev, selectedPaymentMethodId: method.id }))
                  }
                  selectedMethodId={formData.selectedPaymentMethodId}
                  showAddNew={true}
                  allowSelection={true}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Step 3: Notifications & Approval */}
        <TabsContent value="2" className="space-y-4 pb-32 overflow-x-hidden">
          {formData.recipientId && pendingInvitations.some(p => p.display_user_id === formData.recipientId || p.id === formData.recipientId) && (
            <div className="p-3 bg-muted border border-border rounded-lg">
              <div className="flex items-center gap-2 text-foreground">
                <Bell className="h-4 w-4 text-amber-500" />
                <span className="font-medium">Pending Invitation</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                The gift will be automatically sent once {pendingInvitations.find(p => p.display_user_id === formData.recipientId || p.id === formData.recipientId)?.pending_recipient_name} accepts your invitation and provides their shipping address.
              </p>
            </div>
          )}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications & Approval
              </CardTitle>
              <CardDescription>
                Configure how you want to be notified and approve gifts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-approve gifts</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically purchase approved gifts without manual approval
                  </p>
                </div>
                <Switch
                  checked={formData.autoApprove}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, autoApprove: checked }))}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about recurring gift processing and approvals
                  </p>
                </div>
                <Switch
                  checked={formData.emailNotifications}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, emailNotifications: checked }))}
                />
              </div>

              <div>
                <Label>Notification timing (days before event)</Label>
                <div className="flex gap-2 mt-2">
                  {[1, 3, 7, 14].map((day) => (
                    <Badge
                      key={day}
                      variant={formData.notificationDays.includes(day) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          notificationDays: prev.notificationDays.includes(day)
                            ? prev.notificationDays.filter(d => d !== day)
                            : [...prev.notificationDays, day].sort((a, b) => b - a)
                        }));
                      }}
                    >
                      {day} day{day !== 1 ? 's' : ''}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="giftMessage">Custom gift message (optional)</Label>
                <Textarea
                  id="giftMessage"
                  placeholder="Add a personal message to include with gifts..."
                  value={formData.giftMessage}
                  onChange={(e) => setFormData(prev => ({ ...prev, giftMessage: e.target.value }))}
                  maxLength={200}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Navigation - Fixed at bottom with safe area */}
      <div className="sticky bottom-0 bg-background border-t pt-4 pb-16 md:pb-4 px-4 md:px-6 mt-4 overflow-x-hidden" style={{ paddingBottom: 'max(4rem, calc(env(safe-area-inset-bottom, 0px) + 1rem))' }}>
        {/* Mobile: Stack vertically, Desktop: horizontal */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Step indicator - full width on mobile, centered */}
          <div className="text-sm text-muted-foreground text-center md:text-left whitespace-nowrap shrink-0">
            Step {currentStep + 1} of {steps.length}
          </div>
          
          {/* Buttons - centered on mobile, right-aligned on desktop */}
          <div className="flex items-center justify-center md:justify-end gap-3 w-full md:w-auto">
            {(currentStep > 0 || (embedded && onModeChange)) && (
              <motion.div 
                whileTap={isMobile ? undefined : { scale: 0.97 }} 
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <Button 
                  variant="outline" 
                  onClick={handleBack}
                  className="min-h-[44px] min-w-[44px] px-4 md:px-6 touch-manipulation active:scale-[0.97] md:active:scale-100"
                >
                  Back
                </Button>
              </motion.div>
            )}
            
            {currentStep < steps.length - 1 ? (
              <motion.div 
                whileTap={isMobile ? undefined : { scale: 0.97 }} 
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <Button 
                  onClick={handleNext} 
                  className="min-h-[44px] px-4 md:px-6 touch-manipulation active:scale-[0.97] md:active:scale-100"
                  disabled={
                    (currentStep === 0 && (!formData.recipientId || formData.selectedEvents.length === 0)) ||
                    (currentStep === 1 && (formData.budgetLimit < 5 || !formData.selectedPaymentMethodId))
                  }
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
            ) : (
              <motion.div 
                whileTap={isMobile ? undefined : { scale: 0.97 }} 
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <Button 
                  onClick={() => {
                    triggerHapticFeedback('success');
                    handleSubmit();
                  }} 
                  className="min-h-[44px] px-4 md:px-6 touch-manipulation active:scale-[0.97] md:active:scale-100 whitespace-nowrap"
                  disabled={
                    isLoading || 
                    !formData.recipientId || 
                    formData.selectedEvents.length === 0 ||
                    !formData.selectedPaymentMethodId ||
                    formData.budgetLimit < 5
                  }
                >
                  {isLoading ? "Scheduling..." : "Schedule Recurring Gift"}
                  <CheckCircle className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Embedded mode - use Drawer on mobile, Dialog on desktop
  if (embedded) {
    if (isMobile) {
      return (
        <Drawer open={open} onOpenChange={onOpenChange}>
          <DrawerContent className="max-h-[95vh] pb-safe">
            <DrawerHeader className="border-b pb-4">
              <DrawerTitle className="flex items-center gap-2 text-lg font-bold">
                <Gift className="h-5 w-5" />
                {ruleId ? 'Edit Recurring Gift' : 'Set Up Recurring Gifts'}
              </DrawerTitle>
            </DrawerHeader>
            <WizardContent />
          </DrawerContent>
        </Drawer>
      );
    }
    
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden overflow-x-hidden">
          <WizardContent />
        </DialogContent>
      </Dialog>
    );
  }

  // Standalone mode (original behavior)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden overflow-x-hidden">
        <WizardContent />
      </DialogContent>
    </Dialog>
  );
};

export default AutoGiftSetupFlow;
