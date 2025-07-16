import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CheckCircle, DollarSign, Heart, Bell, Gift, Calendar, Zap, MessageSquare, ChevronDown, ChevronRight, Sparkles, RefreshCw } from "lucide-react";
import { Loader2 } from "lucide-react";
import { GiftSetupData } from "../GiftSetupWizard";
import { generateDefaultMessage, getMessageTemplate, replaceMessageVariables } from "@/utils/messageTemplates";
import { format } from "date-fns";

interface WizardStepThreeProps {
  data: GiftSetupData;
  onNext: (stepData: Partial<GiftSetupData>) => void;
  isLoading: boolean;
}

const GIFT_CATEGORIES = [
  "Books & Reading",
  "Fashion & Accessories", 
  "Home & Kitchen",
  "Health & Beauty",
  "Electronics",
  "Sports & Outdoors",
  "Arts & Crafts",
  "Toys & Games",
  "Food & Beverages",
  "Music & Entertainment",
  "Travel & Experiences",
  "Jewelry & Watches"
];

const NOTIFICATION_OPTIONS = [
  { value: 14, label: "2 weeks before" },
  { value: 7, label: "1 week before" },
  { value: 3, label: "3 days before" },
  { value: 1, label: "1 day before" }
];

const EVENT_TYPES = [
  { value: "birthday", label: "Birthday" },
  { value: "anniversary", label: "Anniversary" },
  { value: "christmas", label: "Christmas" },
  { value: "valentine", label: "Valentine's Day" },
  { value: "mothers_day", label: "Mother's Day" },
  { value: "fathers_day", label: "Father's Day" },
  { value: "graduation", label: "Graduation" },
  { value: "promotion", label: "Work Promotion" },
  { value: "custom", label: "Custom Occasion" }
];

export const WizardStepThree: React.FC<WizardStepThreeProps> = ({ data, onNext, isLoading }) => {
  const [formData, setFormData] = useState({
    autoGiftingEnabled: data.autoGiftingEnabled,
    scheduledGiftingEnabled: data.scheduledGiftingEnabled,
    budgetLimit: data.budgetLimit || 100,
    giftCategories: data.giftCategories || [],
    giftMessage: data.giftMessage || "",
    notificationDays: data.notificationDays || [7, 3, 1]
  });

  const [occasionMessages, setOccasionMessages] = useState<Record<string, string>>({});
  const [useSameMessageForAll, setUseSameMessageForAll] = useState(false);
  const [expandedOccasions, setExpandedOccasions] = useState<Set<string>>(new Set());

  // Initialize occasion messages when component mounts or when occasions change
  useEffect(() => {
    if (data.giftingEvents && data.giftingEvents.length > 0) {
      const initialMessages: Record<string, string> = {};
      data.giftingEvents.forEach((event, index) => {
        const eventKey = `${event.dateType}_${index}`;
        if (!occasionMessages[eventKey]) {
          initialMessages[eventKey] = generateDefaultMessage(
            event.dateType,
            data.recipientName,
            event.customName
          );
        }
      });
      
      // Only update if we have new messages to add
      if (Object.keys(initialMessages).length > 0) {
        setOccasionMessages(prev => ({ ...prev, ...initialMessages }));
      }
    }
  }, [data.giftingEvents, data.recipientName]);

  const toggleCategory = (category: string) => {
    setFormData(prev => ({
      ...prev,
      giftCategories: prev.giftCategories.includes(category)
        ? prev.giftCategories.filter(c => c !== category)
        : [...prev.giftCategories, category]
    }));
  };

  const toggleNotificationDay = (day: number) => {
    setFormData(prev => ({
      ...prev,
      notificationDays: prev.notificationDays.includes(day)
        ? prev.notificationDays.filter(d => d !== day)
        : [...prev.notificationDays, day].sort((a, b) => b - a)
    }));
  };

  const updateOccasionMessage = (eventKey: string, message: string) => {
    setOccasionMessages(prev => ({
      ...prev,
      [eventKey]: message
    }));
  };

  const generateNewMessage = (eventKey: string, event: any) => {
    const newMessage = generateDefaultMessage(
      event.dateType,
      data.recipientName,
      event.customName
    );
    updateOccasionMessage(eventKey, newMessage);
  };

  const toggleOccasionExpanded = (eventKey: string) => {
    setExpandedOccasions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventKey)) {
        newSet.delete(eventKey);
      } else {
        newSet.add(eventKey);
      }
      return newSet;
    });
  };

  const getOccasionDisplayName = (event: any) => {
    if (event.dateType === "custom") {
      return event.customName || "Custom Occasion";
    }
    
    const eventType = EVENT_TYPES.find(t => t.value === event.dateType);
    return eventType?.label || "Special Occasion";
  };

  const handleSubmit = () => {
    const submitData = {
      ...formData,
      occasionMessages,
      useSameMessageForAll
    };
    onNext(submitData);
  };


  return (
    <div className="space-y-6">
      {/* Gift Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            How would you like to handle gifts?
          </CardTitle>
          <CardDescription>
            Choose how you want to manage gift giving for {data.recipientName}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-4 border rounded-lg transition-all ${
              formData.autoGiftingEnabled ? "border-primary bg-primary/5" : "border-border"
            }`}>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium">Auto-Gifting</h3>
                    <Switch
                      checked={formData.autoGiftingEnabled}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, autoGiftingEnabled: checked }))}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Automatically purchase and send gifts for special occasions. We'll notify you before each purchase.
                  </p>
                </div>
              </div>
            </div>

            <div className={`p-4 border rounded-lg transition-all ${
              formData.scheduledGiftingEnabled ? "border-primary bg-primary/5" : "border-border"
            }`}>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium">Scheduled Reminders</h3>
                    <Switch
                      checked={formData.scheduledGiftingEnabled}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, scheduledGiftingEnabled: checked }))}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Get reminders before special occasions so you can choose and send gifts manually.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Budget Settings */}
      {formData.autoGiftingEnabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Budget Settings
            </CardTitle>
            <CardDescription>
              Set your budget preferences for automatic gift purchases.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="budgetLimit">Maximum budget per gift</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="budgetLimit"
                  type="number"
                  value={formData.budgetLimit}
                  onChange={(e) => setFormData(prev => ({ ...prev, budgetLimit: Number(e.target.value) }))}
                  className="pl-8"
                  min="25"
                  max="500"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                We'll find thoughtful gifts within this budget range.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gift Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Gift Preferences
          </CardTitle>
          <CardDescription>
            Help us understand what kinds of gifts {data.recipientName} might enjoy.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Preferred Categories (optional)</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {GIFT_CATEGORIES.map((category) => (
                <div
                  key={category}
                  className={`p-2 text-sm border rounded cursor-pointer transition-colors ${
                    formData.giftCategories.includes(category)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => toggleCategory(category)}
                >
                  {category}
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Select categories that match their interests. Leave blank for AI-powered suggestions.
            </p>
          </div>

          {/* Occasion-specific Gift Messages */}
          {data.giftingEvents && data.giftingEvents.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Gift Messages</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={useSameMessageForAll}
                    onCheckedChange={setUseSameMessageForAll}
                  />
                  <span className="text-sm text-muted-foreground">Use same message for all</span>
                </div>
              </div>
              
              {useSameMessageForAll ? (
                <div className="space-y-2">
                  <Label htmlFor="universalMessage">Universal gift message</Label>
                  <Textarea
                    id="universalMessage"
                    placeholder="e.g., Hope this brings a smile to your day! ❤️"
                    value={formData.giftMessage}
                    onChange={(e) => setFormData(prev => ({ ...prev, giftMessage: e.target.value }))}
                    rows={3}
                  />
                  <p className="text-sm text-muted-foreground">
                    This message will be used for all occasions.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.giftingEvents.map((event, index) => {
                    const eventKey = `${event.dateType}_${index}`;
                    const isExpanded = expandedOccasions.has(eventKey);
                    const displayName = getOccasionDisplayName(event);
                    
                    return (
                      <Collapsible key={eventKey} open={isExpanded} onOpenChange={() => toggleOccasionExpanded(eventKey)}>
                        <div className="border rounded-lg">
                          <CollapsibleTrigger className="w-full p-3 flex items-center justify-between hover:bg-accent/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <MessageSquare className="h-4 w-4 text-primary" />
                              <div className="text-left">
                                <div className="font-medium">{displayName}</div>
                                <div className="text-sm text-muted-foreground">
                                  {format(new Date(event.date), "MMM d, yyyy")}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {occasionMessages[eventKey] ? "Customized" : "Default"}
                              </Badge>
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </div>
                          </CollapsibleTrigger>
                          
                          <CollapsibleContent>
                            <div className="p-4 border-t space-y-3">
                              <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium">Message for {displayName}</Label>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => generateNewMessage(eventKey, event)}
                                  className="text-xs"
                                >
                                  <RefreshCw className="h-3 w-3 mr-1" />
                                  Generate new
                                </Button>
                              </div>
                              
                              <Textarea
                                value={occasionMessages[eventKey] || ""}
                                onChange={(e) => updateOccasionMessage(eventKey, e.target.value)}
                                placeholder={`Enter a message for ${displayName}...`}
                                rows={2}
                                className="text-sm"
                              />
                              
                              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                                <Sparkles className="h-3 w-3 mt-0.5 text-primary" />
                                <span>
                                  Use {"{name}"} to include the recipient's name. Messages are automatically personalized for each occasion.
                                </span>
                              </div>
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Choose when you'd like to be notified about upcoming occasions for both auto-gifts and scheduled reminders.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Notify me:</Label>
            <div className="grid grid-cols-2 gap-2">
              {NOTIFICATION_OPTIONS.map((option) => (
                <div
                  key={option.value}
                  className={`p-3 border rounded cursor-pointer transition-colors ${
                    formData.notificationDays.includes(option.value)
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => toggleNotificationDay(option.value)}
                >
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.notificationDays.includes(option.value)}
                    />
                    <span className="text-sm">{option.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <Bell className="inline h-4 w-4 mr-1" />
              These notification settings apply to both auto-gifts and scheduled reminders. 
              You'll receive notifications at the selected times for all your gift occasions.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSubmit} size="lg" className="min-w-40" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Setting up...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Complete Setup
            </>
          )}
        </Button>
      </div>
    </div>
  );
};