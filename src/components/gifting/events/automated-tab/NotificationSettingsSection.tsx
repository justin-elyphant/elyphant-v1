
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Bell, Mail, Smartphone } from "lucide-react";
import { UnifiedGiftSettings } from "@/services/UnifiedGiftManagementService";

interface NotificationSettingsSectionProps {
  settings: UnifiedGiftSettings | null;
  onUpdateSettings: (updates: Partial<UnifiedGiftSettings>) => void;
}

const NotificationSettingsSection = ({ settings, onUpdateSettings }: NotificationSettingsSectionProps) => {
  const [emailNotifications, setEmailNotifications] = useState(settings?.email_notifications ?? true);
  const [pushNotifications, setPushNotifications] = useState(settings?.push_notifications ?? false);
  const [autoApprove, setAutoApprove] = useState(settings?.auto_approve_gifts ?? false);
  const [defaultDays, setDefaultDays] = useState(settings?.default_notification_days || [7, 3, 1]);

  const dayOptions = [
    { value: 30, label: "30 days before" },
    { value: 14, label: "2 weeks before" },
    { value: 7, label: "1 week before" },
    { value: 3, label: "3 days before" },
    { value: 1, label: "1 day before" },
    { value: 0, label: "On the day" }
  ];

  const handleDayToggle = (day: number, checked: boolean) => {
    if (checked) {
      setDefaultDays([...defaultDays, day].sort((a, b) => b - a));
    } else {
      setDefaultDays(defaultDays.filter(d => d !== day));
    }
  };

  const handleSave = () => {
    onUpdateSettings({
      email_notifications: emailNotifications,
      push_notifications: pushNotifications,
      auto_approve_gifts: autoApprove,
      default_notification_days: defaultDays
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Bell className="h-5 w-5 mr-2" />
          Notification Settings
        </CardTitle>
        <CardDescription>
          Configure how and when you want to be notified about automated gifts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center text-sm font-medium">
                <Mail className="h-4 w-4 mr-2" />
                Email Notifications
              </Label>
              <p className="text-xs text-muted-foreground">
                Receive email reminders about upcoming gifts
              </p>
            </div>
            <Switch
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center text-sm font-medium">
                <Smartphone className="h-4 w-4 mr-2" />
                Push Notifications
              </Label>
              <p className="text-xs text-muted-foreground">
                Receive push notifications on your device
              </p>
            </div>
            <Switch
              checked={pushNotifications}
              onCheckedChange={setPushNotifications}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">
                Auto-approve Gifts
              </Label>
              <p className="text-xs text-muted-foreground">
                Automatically send gifts without manual approval
              </p>
            </div>
            <Switch
              checked={autoApprove}
              onCheckedChange={setAutoApprove}
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium">Default Reminder Schedule</Label>
          <p className="text-xs text-muted-foreground">
            Choose when to receive reminders for new auto-gifting rules
          </p>
          <div className="grid grid-cols-2 gap-2">
            {dayOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`default-day-${option.value}`}
                  checked={defaultDays.includes(option.value)}
                  onCheckedChange={(checked) => handleDayToggle(option.value, checked as boolean)}
                />
                <Label
                  htmlFor={`default-day-${option.value}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave}>
            Save Notification Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationSettingsSection;
