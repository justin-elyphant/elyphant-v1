import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, DollarSign, Heart, Bell, Gift, Calendar, Zap } from "lucide-react";
import { Loader2 } from "lucide-react";
import { GiftSetupData } from "../GiftSetupWizard";

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

export const WizardStepThree: React.FC<WizardStepThreeProps> = ({ data, onNext, isLoading }) => {
  const [formData, setFormData] = useState({
    autoGiftingEnabled: data.autoGiftingEnabled,
    scheduledGiftingEnabled: data.scheduledGiftingEnabled,
    budgetLimit: data.budgetLimit || 100,
    giftCategories: data.giftCategories || [],
    giftMessage: data.giftMessage || "",
    notificationDays: data.notificationDays || [7, 3, 1]
  });

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

  const handleSubmit = () => {
    onNext(formData);
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
            <div className={`p-4 border rounded-lg cursor-pointer transition-all ${
              formData.autoGiftingEnabled ? "border-primary bg-primary/5" : "border-border"
            }`} onClick={() => setFormData(prev => ({ ...prev, autoGiftingEnabled: !prev.autoGiftingEnabled }))}>
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

            <div className={`p-4 border rounded-lg cursor-pointer transition-all ${
              formData.scheduledGiftingEnabled ? "border-primary bg-primary/5" : "border-border"
            }`} onClick={() => setFormData(prev => ({ ...prev, scheduledGiftingEnabled: !prev.scheduledGiftingEnabled }))}>
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

          <div className="space-y-2">
            <Label htmlFor="giftMessage">Default gift message (optional)</Label>
            <Textarea
              id="giftMessage"
              placeholder="e.g., Hope this brings a smile to your day! ❤️"
              value={formData.giftMessage}
              onChange={(e) => setFormData(prev => ({ ...prev, giftMessage: e.target.value }))}
              rows={3}
            />
            <p className="text-sm text-muted-foreground">
              This message will be included with your gifts. You can customize it for each occasion.
            </p>
          </div>
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
            Choose when you'd like to be notified about upcoming occasions.
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