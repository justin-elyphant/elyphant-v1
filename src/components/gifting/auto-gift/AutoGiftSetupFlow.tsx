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
import NewRecipientForm from "@/components/shared/NewRecipientForm";
import { UnifiedRecipient } from "@/services/unifiedRecipientService";
import { toast } from "sonner";
import HolidaySelector from "@/components/gifting/events/add-dialog/HolidaySelector";
import SmartHolidayInfo from "./SmartHolidayInfo";
import { DatePicker } from "@/components/ui/date-picker";
import UnifiedPaymentMethodManager from "@/components/payments/UnifiedPaymentMethodManager";

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
  const { createRule, updateRule, settings, updateSettings } = useAutoGifting();
  const { connections, pendingInvitations } = useEnhancedConnections();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewRecipientForm, setShowNewRecipientForm] = useState(false);

  const [formData, setFormData] = useLocalStorage('autoGiftDraft', {
    recipientId: recipientId || "",
    eventType: eventType || "",
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
    if (!formData.recipientId || !formData.eventType) {
      toast.error("Please select a recipient and event type");
      return;
    }

    if (formData.eventType === "holiday" && !formData.specificHoliday) {
      toast.error("Please select a specific holiday");
      return;
    }

    if (formData.eventType === "other" && !formData.selectedDate) {
      toast.error("Please select a date for your gift delivery");
      return;
    }

    if (!formData.selectedPaymentMethodId) {
      toast.error("Please select a payment method for auto-gifting");
      return;
    }

    setIsLoading(true);

    try {
      // Phase 2: Setup initiation with progress feedback
      toast.info("Initializing secure auto-gift setup...", { duration: 2000 });

      // Find the selected recipient from both accepted connections and pending invitations
      const allConnections = [...connections, ...pendingInvitations];
      const selectedConnection = allConnections.find(conn => 
        conn.id === formData.recipientId || 
        conn.display_user_id === formData.recipientId || 
        conn.connected_user_id === formData.recipientId
      );

      // Determine if this is a pending invitation or accepted connection
      const isPendingInvitation = selectedConnection?.status === 'pending_invitation';
      
      const ruleData = {
        // Always include recipient_id (use connection ID for pending invitations)
        recipient_id: isPendingInvitation ? selectedConnection?.id || formData.recipientId : formData.recipientId,
        date_type: formData.eventType === "holiday" ? formData.specificHoliday : formData.eventType,
        // For "just because" events, store the selected date in scheduled_date
        scheduled_date: formData.eventType === "other" && formData.selectedDate ? formData.selectedDate.toISOString().split('T')[0] : null,
        event_id: eventId,
        is_active: true,
        budget_limit: formData.budgetLimit,
        notification_preferences: {
          enabled: formData.emailNotifications,
          days_before: formData.notificationDays,
          email: formData.emailNotifications,
          push: false,
        },
        gift_selection_criteria: {
          source: "both" as const, // Use "both" to leverage the smart cascading logic
          max_price: formData.budgetLimit,
          min_price: Math.max(1, formData.budgetLimit * 0.1),
          categories: [], // Let the backend handle category preferences automatically
          exclude_items: [],
        },
        payment_method_id: formData.selectedPaymentMethodId,
        gift_message: formData.giftMessage,
      };

      // Phase 3: Secure rule creation/update with enhanced feedback
      let result;
      if (ruleId) {
        toast.info("Updating auto-gifting rule securely...", { duration: 2000 });
        result = await updateRule(ruleId, ruleData);
        toast.success("Auto-gifting rule updated successfully!", {
          description: "All changes have been saved and secured with token validation"
        });
      } else {
        toast.info("Creating auto-gifting rule with security validation...", { duration: 2000 });
        result = await createRule(ruleData);
        
        // Show different success messages for holidays vs other events
        if (formData.eventType === "holiday") {
          toast.success(`Holiday auto-gifting set up for ${formData.specificHoliday}!`, {
            description: "The holiday event has been added to your calendar with secure token validation and will appear in Recipient Events for your connections"
          });
        } else {
          toast.success("Auto-gifting rule created successfully!", {
            description: "Setup completed with security validation - you'll be notified when gift suggestions are ready for approval"
          });
        }
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
        description: "Your auto-gifting configuration is now active and secured"
      });
      
      // Clear the draft after successful completion
      localStorage.removeItem('autoGiftDraft');
      console.log('✅ Auto-gift draft cleared after successful setup');
      
      onOpenChange(false);
      setCurrentStep(0);
      
    } catch (error) {
      console.error("Error in auto-gift setup:", error);
      
      // Enhanced error handling with specific feedback
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      
      if (errorMessage.includes("rate limit")) {
        toast.error("Setup rate limit exceeded", {
          description: "Please wait a moment before creating another auto-gifting rule"
        });
      } else if (errorMessage.includes("validation")) {
        toast.error("Setup validation failed", {
          description: "Please check your inputs and try again"
        });
      } else {
        toast.error("Failed to create auto-gifting rule", {
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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto pb-safe-bottom">
        <div className="max-h-[calc(90vh-120px)] md:max-h-none overflow-y-auto mobile-container ios-smooth-scroll">
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
                  </Label>
                  <Select 
                    value={formData.recipientId} 
                    onValueChange={(value) => {
                      if (value === "__add_new__") {
                        setShowNewRecipientForm(true);
                      } else {
                        setFormData(prev => ({ ...prev, recipientId: value }));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a connection" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Accepted Connections */}
                      {connections
                        .filter(conn => conn.status === 'accepted')
                        .map((connection) => (
                        <SelectItem key={connection.id} value={connection.display_user_id || connection.connected_user_id}>
                          <div className="flex items-center gap-2">
                            <span>{connection.profile_name || 'Unknown'}</span>
                            <Badge variant="outline" className="text-xs">
                              {connection.relationship_type}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                      
                      {/* Pending Invitations */}
                      {pendingInvitations
                        .map((connection) => (
                        <SelectItem key={connection.id} value={connection.id}>
                          <div className="flex items-center gap-2">
                            <span>{connection.profile_name || connection.pending_recipient_name || 'Unknown'}</span>
                            <Badge variant="outline" className="text-xs text-orange-600">
                              Pending
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {connection.relationship_type}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                      
                      <SelectItem value="__add_new__">
                        <div className="flex items-center gap-2 text-primary">
                          <Users className="h-4 w-4" />
                          <span>Add New Recipient</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="eventType" className="flex items-center gap-2">
                    Event Type
                    {initialData?.eventType && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Pre-filled
                      </Badge>
                    )}
                  </Label>
                  <Select 
                    value={formData.eventType} 
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      eventType: value,
                      specificHoliday: value === "holiday" ? prev.specificHoliday : "",
                      calculatedDate: value === "holiday" ? prev.calculatedDate : null,
                      selectedDate: value === "other" ? prev.selectedDate : undefined
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent>
                      {eventTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.eventType === "holiday" && (
                  <HolidaySelector
                    value={formData.specificHoliday}
                    onChange={(holiday) => setFormData(prev => ({ ...prev, specificHoliday: holiday }))}
                    onDateCalculated={(date) => setFormData(prev => ({ ...prev, calculatedDate: date }))}
                  />
                )}

                {formData.eventType === "other" && (
                  <div className="space-y-2">
                    <Label>Select Delivery Date</Label>
                    <DatePicker
                      date={formData.selectedDate}
                      setDate={(date) => setFormData(prev => ({ ...prev, selectedDate: date }))}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    />
                    <p className="text-sm text-muted-foreground">
                      Choose any future date to schedule your "just because" gift delivery
                    </p>
                  </div>
                )}

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
        <div className="sticky bottom-0 bg-background border-t pt-4 pb-4 md:pb-4 safe-area-bottom -mx-6 px-6 mt-4">
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
                    (currentStep === 0 && (!formData.recipientId || !formData.eventType || 
                      (formData.eventType === "holiday" && !formData.specificHoliday) ||
                      (formData.eventType === "other" && !formData.selectedDate))) ||
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
                  disabled={isLoading || !formData.recipientId || !formData.eventType ||
                    (formData.eventType === "holiday" && !formData.specificHoliday) ||
                    (formData.eventType === "other" && !formData.selectedDate) ||
                    !formData.selectedPaymentMethodId}
                >
                  {isLoading ? "Creating..." : "Create Auto-Gift Rule"}
                  <CheckCircle className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
        </div>

        {/* New Recipient Form Modal */}
        {showNewRecipientForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <NewRecipientForm
              onRecipientCreate={(recipient) => {
                // Add to form data as pending recipient
                setFormData(prev => ({ 
                  ...prev, 
                  recipientId: recipient.id 
                }));
                setShowNewRecipientForm(false);
                toast.success(`Added ${recipient.name} as recipient`);
              }}
              onCancel={() => setShowNewRecipientForm(false)}
              title="Add New Auto-Gift Recipient"
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AutoGiftSetupFlow;