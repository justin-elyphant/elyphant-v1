import React, { useState, useEffect } from "react";
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
  CheckCircle, ArrowRight, Bell, ShoppingCart 
} from "lucide-react";
import { useAutoGifting } from "@/hooks/useAutoGifting";
import { useEnhancedConnections } from "@/hooks/profile/useEnhancedConnections";
import NewRecipientForm from "@/components/shared/NewRecipientForm";
import { UnifiedRecipient } from "@/services/unifiedRecipientService";
import { toast } from "sonner";

interface AutoGiftSetupFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId?: string;
  eventType?: string;
  recipientId?: string;
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
  recipientId
}) => {
  const { createRule, settings } = useAutoGifting();
  const { connections } = useEnhancedConnections();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewRecipientForm, setShowNewRecipientForm] = useState(false);

  const [formData, setFormData] = useState({
    recipientId: recipientId || "",
    eventType: eventType || "",
    budgetLimit: settings?.default_budget_limit || 50,
    giftSource: "wishlist" as "wishlist" | "ai" | "both",
    categories: [] as string[],
    autoApprove: false,
    emailNotifications: true,
    notificationDays: [7, 3, 1],
    giftMessage: ""
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
      title: "Set Budget & Preferences",
      description: "Configure your budget and gift selection preferences",
      icon: DollarSign
    },
    {
      id: "notifications",
      title: "Notifications & Approval",
      description: "Set up notifications and approval preferences",
      icon: Bell
    }
  ];

  const availableCategories = [
    "Electronics", "Fashion", "Books", "Home & Garden", 
    "Sports", "Beauty", "Toys", "Jewelry", "Art", "Kitchen"
  ];

  const eventTypes = [
    { value: "birthday", label: "Birthday" },
    { value: "anniversary", label: "Anniversary" },
    { value: "graduation", label: "Graduation" },
    { value: "promotion", label: "Promotion" },
    { value: "holiday", label: "Holiday" },
    { value: "other", label: "Other Special Day" }
  ];

  useEffect(() => {
    if (recipientId) setFormData(prev => ({ ...prev, recipientId }));
    if (eventType) setFormData(prev => ({ ...prev, eventType }));
  }, [recipientId, eventType]);

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
    if (!formData.recipientId || !formData.eventType) {
      toast.error("Please select a recipient and event type");
      return;
    }

    setIsLoading(true);

    try {
      // Find the selected recipient to get proper data
      const selectedConnection = connections.find(conn => 
        conn.id === formData.recipientId || 
        conn.display_user_id === formData.recipientId || 
        conn.connected_user_id === formData.recipientId
      );

      // Determine if this is a pending invitation or accepted connection
      const isPendingInvitation = selectedConnection?.status === 'pending_invitation';
      
      const ruleData = {
        // Always include recipient_id (use connection ID for pending invitations)
        recipient_id: isPendingInvitation ? selectedConnection?.id || formData.recipientId : formData.recipientId,
        date_type: formData.eventType,
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
          source: formData.giftSource,
          max_price: formData.budgetLimit,
          min_price: Math.max(1, formData.budgetLimit * 0.1),
          categories: formData.categories,
          exclude_items: [],
        },
      };

      await createRule(ruleData);

      toast.success("Auto-gifting rule created successfully!", {
        description: "You'll be notified when gift suggestions are ready for approval"
      });
      
      onOpenChange(false);
      setCurrentStep(0);
      
    } catch (error) {
      console.error("Error creating auto-gift rule:", error);
      toast.error("Failed to create auto-gifting rule");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCategory = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const getCurrentStepIcon = () => {
    const Icon = steps[currentStep].icon;
    return <Icon className="h-6 w-6" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Set Up Auto-Gifting
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
          <TabsContent value="0" className="space-y-4">
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
                  <Label htmlFor="recipient">Recipient</Label>
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
                      {connections
                        .filter(conn => conn.status === 'pending_invitation')
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
                  <Label htmlFor="eventType">Event Type</Label>
                  <Select 
                    value={formData.eventType} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, eventType: value }))}
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* Step 2: Budget & Preferences */}
          <TabsContent value="1" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Budget & Gift Preferences
                </CardTitle>
                <CardDescription>
                  Set your budget and how gifts should be selected
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
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
                  <Label>Gift Selection Method</Label>
                  <div className="grid grid-cols-1 gap-3 mt-2">
                    <div 
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        formData.giftSource === "wishlist" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, giftSource: "wishlist" }))}
                    >
                      <div className="flex items-center gap-3">
                        <ShoppingCart className="h-4 w-4" />
                        <div>
                          <p className="font-medium">From Wishlist</p>
                          <p className="text-sm text-muted-foreground">Choose from recipient's wishlist items</p>
                        </div>
                      </div>
                    </div>

                    <div 
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        formData.giftSource === "ai" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, giftSource: "ai" }))}
                    >
                      <div className="flex items-center gap-3">
                        <Sparkles className="h-4 w-4" />
                        <div>
                          <p className="font-medium">AI Recommendations</p>
                          <p className="text-sm text-muted-foreground">Let AI suggest gifts via Zinc API</p>
                        </div>
                      </div>
                    </div>

                    <div 
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        formData.giftSource === "both" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, giftSource: "both" }))}
                    >
                      <div className="flex items-center gap-3">
                        <Gift className="h-4 w-4" />
                        <div>
                          <p className="font-medium">Smart Combination</p>
                          <p className="text-sm text-muted-foreground">Wishlist first, AI backup if needed</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {(formData.giftSource === "ai" || formData.giftSource === "both") && (
                  <div>
                    <Label>Preferred Categories (for AI selection)</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {availableCategories.map((category) => (
                        <Badge
                          key={category}
                          variant={formData.categories.includes(category) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => toggleCategory(category)}
                        >
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Step 3: Notifications & Approval */}
          <TabsContent value="2" className="space-y-4">
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

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            Step {currentStep + 1} of {steps.length}
          </div>
          
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
            )}
            
            {currentStep < steps.length - 1 ? (
              <Button 
                onClick={handleNext}
                disabled={
                  (currentStep === 0 && (!formData.recipientId || !formData.eventType)) ||
                  (currentStep === 1 && formData.budgetLimit < 5)
                }
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={isLoading || !formData.recipientId || !formData.eventType}
              >
                {isLoading ? "Creating..." : "Create Auto-Gift Rule"}
                <CheckCircle className="ml-2 h-4 w-4" />
              </Button>
            )}
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