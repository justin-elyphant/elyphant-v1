
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Gift, DollarSign, Bell, Package, List, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface AutoGiftSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventPerson: string;
  eventType: string;
  onSave: (settings: AutoGiftSettings) => void;
}

interface AutoGiftSettings {
  enabled: boolean;
  budget: number;
  giftSource: "wishlist" | "ai" | "both" | "specific";
  specificProduct?: string;
  notifications: {
    enabled: boolean;
    daysBeforeNotify: number[];
  };
  autoApprove: boolean;
  giftMessage?: string;
}

const AutoGiftSetupDialog = ({ 
  open, 
  onOpenChange, 
  eventPerson, 
  eventType, 
  onSave 
}: AutoGiftSetupDialogProps) => {
  const [settings, setSettings] = useState<AutoGiftSettings>({
    enabled: true,
    budget: 50,
    giftSource: "wishlist",
    notifications: {
      enabled: true,
      daysBeforeNotify: [7, 3, 1]
    },
    autoApprove: false,
    giftMessage: ""
  });

  const handleSave = () => {
    if (settings.budget <= 0) {
      toast.error("Please enter a valid budget amount");
      return;
    }

    onSave(settings);
    onOpenChange(false);
    
    toast.success(`Auto-gifting configured for ${eventPerson}'s ${eventType}`, {
      description: `Budget: $${settings.budget} • Source: ${settings.giftSource}`
    });
  };

  const giftSourceOptions = [
    {
      value: "wishlist",
      label: "From Wishlist",
      description: "Select from their public wishlist items",
      icon: List
    },
    {
      value: "ai",
      label: "AI Recommendations",
      description: "Let AI suggest personalized gifts",
      icon: Sparkles
    },
    {
      value: "both",
      label: "Wishlist + AI",
      description: "Combine wishlist and AI suggestions",
      icon: Gift
    },
    {
      value: "specific",
      label: "Specific Product",
      description: "Choose a specific product to send",
      icon: Package
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[500px] max-w-[90vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-purple-500" />
            Auto-Gift Setup: {eventPerson}'s {eventType}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Enable Auto-Gifting */}
          <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div>
              <Label className="text-base font-medium">Enable Auto-Gifting</Label>
              <p className="text-sm text-muted-foreground">
                Automatically send a gift on this date
              </p>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(enabled) => setSettings(prev => ({ ...prev, enabled }))}
            />
          </div>

          {settings.enabled && (
            <>
              {/* Budget Setting */}
              <div className="space-y-2">
                <Label className="flex items-center text-base font-medium">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Gift Budget
                </Label>
                <Input
                  type="number"
                  value={settings.budget}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    budget: Number(e.target.value) 
                  }))}
                  placeholder="50"
                  min="1"
                  max="1000"
                />
                <p className="text-xs text-muted-foreground">
                  Maximum amount to spend on this gift
                </p>
              </div>

              {/* Gift Source Selection */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Gift Selection Source</Label>
                <RadioGroup 
                  value={settings.giftSource} 
                  onValueChange={(value: any) => setSettings(prev => ({ 
                    ...prev, 
                    giftSource: value 
                  }))}
                >
                  {giftSourceOptions.map((option) => {
                    const IconComponent = option.icon;
                    return (
                      <div key={option.value} className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                        <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                        <div className="flex-1 space-y-1">
                          <Label htmlFor={option.value} className="flex items-center text-sm font-medium cursor-pointer">
                            <IconComponent className="h-4 w-4 mr-2" />
                            {option.label}
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            {option.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </RadioGroup>
              </div>

              {/* Specific Product Input */}
              {settings.giftSource === "specific" && (
                <div className="space-y-2">
                  <Label>Specific Product URL or Name</Label>
                  <Input
                    value={settings.specificProduct || ""}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      specificProduct: e.target.value 
                    }))}
                    placeholder="Enter product URL or description"
                  />
                </div>
              )}

              {/* Notifications */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="flex items-center text-base font-medium">
                      <Bell className="h-4 w-4 mr-2" />
                      Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Get reminders before the event
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.enabled}
                    onCheckedChange={(enabled) => setSettings(prev => ({ 
                      ...prev, 
                      notifications: { ...prev.notifications, enabled } 
                    }))}
                  />
                </div>

                {settings.notifications.enabled && (
                  <div className="pl-6 space-y-2">
                    <Label className="text-sm">Notify me</Label>
                    <div className="flex flex-wrap gap-2">
                      {[7, 3, 1].map((days) => (
                        <label key={days} className="flex items-center space-x-1 text-sm">
                          <input
                            type="checkbox"
                            checked={settings.notifications.daysBeforeNotify.includes(days)}
                            onChange={(e) => {
                              const currentDays = settings.notifications.daysBeforeNotify;
                              const newDays = e.target.checked
                                ? [...currentDays, days]
                                : currentDays.filter(d => d !== days);
                              setSettings(prev => ({
                                ...prev,
                                notifications: { ...prev.notifications, daysBeforeNotify: newDays }
                              }));
                            }}
                            className="rounded"
                          />
                          <span>{days} day{days > 1 ? 's' : ''} before</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Auto-approve */}
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <Label className="text-sm font-medium">Auto-approve Gifts</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically purchase without confirmation
                  </p>
                </div>
                <Switch
                  checked={settings.autoApprove}
                  onCheckedChange={(autoApprove) => setSettings(prev => ({ 
                    ...prev, 
                    autoApprove 
                  }))}
                />
              </div>

              {/* Gift Message */}
              <div className="space-y-2">
                <Label>Gift Message (Optional)</Label>
                <Textarea
                  value={settings.giftMessage || ""}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    giftMessage: e.target.value 
                  }))}
                  placeholder="Add a personal message to include with the gift..."
                  rows={3}
                />
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!settings.enabled}>
            Save Auto-Gift Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AutoGiftSetupDialog;
