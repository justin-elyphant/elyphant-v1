import React, { useState, useEffect } from "react";
import { useLocalStorage } from "@/components/gifting/hooks/useLocalStorage";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { 
  Gift, DollarSign, Calendar, Users, Sparkles, 
  CheckCircle, ArrowRight, Bell, ShoppingCart, CreditCard 
} from "lucide-react";
import { useAutoGifting } from "@/hooks/useAutoGifting";
import { useEnhancedConnections } from "@/hooks/profile/useEnhancedConnections";
import { UnifiedRecipient } from "@/services/unifiedRecipientService";
import { toast } from "sonner";
import { RecipientSearchCombobox } from "./RecipientSearchCombobox";
import HolidaySelector from "@/components/gifting/events/add-dialog/HolidaySelector";
import SmartHolidayInfo from "./SmartHolidayInfo";
import { DatePicker } from "@/components/ui/date-picker";
import UnifiedPaymentMethodManager from "@/components/payments/UnifiedPaymentMethodManager";
import MultiEventSelector, { SelectedEvent } from "@/components/gifting/events/add-dialog/MultiEventSelector";
import { unifiedGiftManagementService } from "@/services/UnifiedGiftManagementService";

interface AutoGiftSetupFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId?: string;
  eventType?: string;
  recipientId?: string;
  initialData?: any; // For editing existing rules
  ruleId?: string; // For updating existing rules
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
  ruleId
}) => {
  // Component initialization
  const { createRule, updateRule, settings, updateSettings } = useAutoGifting();
  const { connections, pendingInvitations, fetchConnections } = useEnhancedConnections();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  // Ref for the scrollable container
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useLocalStorage('autoGiftDraft', {
    recipientId: recipientId || "",
    recipientName: undefined as string | undefined,
    relationshipType: undefined as string | undefined,
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

  const steps: SetupStep[] = [
    {
      id: "recipient",
      title: "Choose Recipient",
      description: "Select who you want to set up auto-gifting for",
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

  const eventTypes = [
    { value: "birthday", label: "Birthday" },
    { value: "anniversary", label: "Anniversary" },
    { value: "graduation", label: "Graduation" },
    { value: "promotion", label: "Promotion" },
    { value: "holiday", label: "Holiday" },
    { value: "other", label: "Just Because" }
  ];

  useEffect(() => {
    console.log('🔍 AutoGiftSetupFlow - Props received:', { recipientId, eventType, initialData, ruleId });
    console.log('🔍 AutoGiftSetupFlow - Current formData before update:', formData);
    
    // Check if we have a saved draft and show notification
    const existingDraft = localStorage.getItem('autoGiftDraft');
    if (existingDraft && open && !initialData) {
      try {
        const parsedDraft = JSON.parse(existingDraft);
        // Only show toast if there's meaningful data in the draft
        if (parsedDraft.recipientId || parsedDraft.eventType || parsedDraft.giftMessage) {
          toast.info("Draft restored", {
            description: "Your previous auto-gift setup has been restored"
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
        toast.success(`Auto-gift setup opened for ${initialData.recipientName}`, {
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
        console.log('🔍 AutoGiftSetupFlow - New formData after update:', newData);
        return newData;
      });
    } else {
      console.log('🔍 AutoGiftSetupFlow - No initialData provided');
    }
  }, [recipientId, eventType, initialData, ruleId, open]);

  // Scroll to top when step changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
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
      toast.error("Please select a payment method for auto-gifting");
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
      toast.info("Initializing secure auto-gift setup...", { duration: 2000 });

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

      console.log('🔍 Auto-gift setup - Enhanced connection resolution:', {
        formDataRecipientId: formData.recipientId,
        isEmail,
        isUuid,
        hasSelectedConnection: !!selectedConnection,
        connectionId: selectedConnection?.id,
        connectionStatus: selectedConnection?.status,
        isPendingInvitation,
        actualRecipientId,  // Should be null for pending
        pendingEmail,  // Should be email for pending
        autoCreated: isEmail && selectedConnection && !allConnections.find(c => c.id === selectedConnection?.id)
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
      
      // Create rule data for each selected event
      const rulesToCreate = formData.selectedEvents.map(event => ({
        user_id: "", // Will be set by service
        recipient_id: actualRecipientId,
        pending_recipient_email: pendingEmail,
        date_type: event.eventType === "holiday" ? event.specificHoliday! : event.eventType,
        scheduled_date: event.eventType === "other" && event.customDate 
          ? event.customDate.toISOString().split('T')[0] 
          : null,
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
          source: "both" as const,
          max_price: formData.budgetLimit,
          min_price: Math.max(1, formData.budgetLimit * 0.1),
          categories: [],
          exclude_items: [],
        },
        payment_method_id: formData.selectedPaymentMethodId,
        gift_message: formData.giftMessage,
      }));

      // Phase 3: Batch rule creation with enhanced feedback
      if (ruleId) {
        // For editing, only update the first rule (legacy single-event mode)
        toast.info("Updating auto-gifting rule securely...", { duration: 2000 });
        await updateRule(ruleId, rulesToCreate[0]);
        toast.success("Auto-gifting rule updated successfully!", {
          description: "All changes have been saved and secured with token validation"
        });
      } else {
        toast.info(`Creating ${rulesToCreate.length} auto-gifting rules...`, { duration: 2000 });
        
        // Use batch creation service
        // Pass the recipient_id from the first rule (will be null for pending invitations)
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

      // Phase 5: Successful completion with secure closure
      toast.success("Setup completed successfully!", {
        description: `${rulesToCreate.length} auto-gifting events configured and secured`
      });
      
      // Clear the draft after successful completion
      localStorage.removeItem('autoGiftDraft');
      console.log('✅ Auto-gift draft cleared after successful setup');
      
      onOpenChange(false);
      setCurrentStep(0);
      
    } catch (error) {
      console.error("Error in auto-gift setup:", error);
      
      const e: any = error;
      const errorMessage = e?.message || e?.error?.message || e?.hint || e?.code || 'Unknown error occurred';
      const errorDetails = e?.details || e?.error_description || e?.name;
      if (errorDetails) console.error('Auto-gift setup details:', errorDetails);
      
      if (typeof error === 'object') {
        try { console.error('Auto-gift setup raw:', JSON.stringify(error)); } catch {}
      }
      
      if (String(errorMessage).toLowerCase().includes("rate limit")) {
        toast.error("Setup rate limit exceeded", {
          description: "Please wait a moment before creating another auto-gifting rule"
        });
      } else if (String(errorMessage).toLowerCase().includes("validation") || String(errorMessage).toLowerCase().includes("recipient")) {
        toast.error("Setup validation failed", {
          description: errorMessage
        });
      } else {
        toast.error("Failed to create auto-gifting rules", {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden">
        <div 
          ref={scrollContainerRef}
          className="max-h-[calc(90vh-120px)] overflow-y-auto mobile-container ios-smooth-scroll pb-safe-bottom"
        >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            {ruleId ? 'Edit Auto-Gifting Rule' : 'Set Up Auto-Gifting'}
          </DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <Tabs value={currentStep.toString()} className="w-full">
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
          <TabsContent value="0" className="space-y-4 pb-32">
            {initialData?.recipientName && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">Event Details Pre-filled</span>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Setting up auto-gifting for {initialData.recipientName}'s {initialData.eventType}
                  {initialData.eventDate && ` on ${new Date(initialData.eventDate).toLocaleDateString()}`}
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
                  Select who you want to set up automated gifting for
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="recipient" className="flex items-center gap-2">
                    Recipient
                    {initialData?.recipientName && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Pre-filled
                      </Badge>
                    )}
                    {formData.recipientId && pendingInvitations.some(p => p.display_user_id === formData.recipientId || p.id === formData.recipientId) && (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        Pending Invitation
                      </Badge>
                    )}
                  </Label>
                   <RecipientSearchCombobox
                    value={formData.recipientId}
                    onChange={({ recipientId, recipientName, relationshipType }) => 
                      setFormData(prev => ({ 
                        ...prev, 
                        recipientId,
                        recipientName,
                        relationshipType: relationshipType || prev.relationshipType
                      }))
                    }
                    connections={connections}
                    pendingInvitations={pendingInvitations}
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
                    }}
                  />
                  {formData.recipientId && pendingInvitations.some(p => p.display_user_id === formData.recipientId || p.id === formData.recipientId) && (
                    <p className="text-sm text-muted-foreground mt-2">
                      This gift will be sent once {pendingInvitations.find(p => p.display_user_id === formData.recipientId || p.id === formData.recipientId)?.pending_recipient_name} accepts the invitation and provides their address.
                    </p>
                  )}
                </div>

                <MultiEventSelector
                  value={formData.selectedEvents}
                  onChange={(events) => setFormData(prev => ({ ...prev, selectedEvents: events }))}
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
                      Auto-gifting will trigger for: {new Date(formData.calculatedDate).toLocaleDateString()}
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
          <TabsContent value="1" className="space-y-4 pb-32">
            {formData.recipientId && pendingInvitations.some(p => p.display_user_id === formData.recipientId || p.id === formData.recipientId) && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                  <Bell className="h-4 w-4" />
                  <span className="font-medium">Pending Invitation</span>
                </div>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  Auto-gifting will activate once {pendingInvitations.find(p => p.display_user_id === formData.recipientId || p.id === formData.recipientId)?.pending_recipient_name} accepts your connection and provides their shipping address.
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
                    Select which payment method to use for auto-gifting purchases
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
          <TabsContent value="2" className="space-y-4 pb-32">
            {formData.recipientId && pendingInvitations.some(p => p.display_user_id === formData.recipientId || p.id === formData.recipientId) && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                  <Bell className="h-4 w-4" />
                  <span className="font-medium">Pending Invitation</span>
                </div>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
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
                      Get notified about auto-gift processing and approvals
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
        <div className="sticky bottom-0 bg-background border-t pt-4 pb-4 md:pb-4 pb-safe-bottom px-6 mt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </div>
            
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button 
                  variant="outline" 
                  onClick={handleBack}
                  className="min-h-[44px] marketplace-touch-target"
                >
                  Back
                </Button>
              )}
              
              {currentStep < steps.length - 1 ? (
                <Button 
                  onClick={handleNext} 
                  className="min-h-[44px] marketplace-touch-target"
                  disabled={
                    (currentStep === 0 && (!formData.recipientId || formData.selectedEvents.length === 0)) ||
                    (currentStep === 1 && (formData.budgetLimit < 5 || !formData.selectedPaymentMethodId))
                  }
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit} 
                  className="min-h-[44px] marketplace-touch-target"
                  disabled={
                    isLoading || 
                    !formData.recipientId || 
                    formData.selectedEvents.length === 0 ||
                    !formData.selectedPaymentMethodId ||
                    formData.budgetLimit < 5
                  }
                >
                  {isLoading ? "Creating..." : "Create Auto-Gift Rule"}
                  <CheckCircle className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AutoGiftSetupFlow;