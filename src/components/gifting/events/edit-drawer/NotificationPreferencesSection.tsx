
import React from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Bell, Mail, Smartphone } from "lucide-react";

interface NotificationPreferencesSectionProps {
  notificationDays: number[];
  emailNotifications: boolean;
  pushNotifications: boolean;
  setNotificationDays: (days: number[]) => void;
  setEmailNotifications: (enabled: boolean) => void;
  setPushNotifications: (enabled: boolean) => void;
}

const NotificationPreferencesSection = ({
  notificationDays,
  emailNotifications,
  pushNotifications,
  setNotificationDays,
  setEmailNotifications,
  setPushNotifications
}: NotificationPreferencesSectionProps) => {
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
      setNotificationDays([...notificationDays, day].sort((a, b) => b - a));
    } else {
      setNotificationDays(notificationDays.filter(d => d !== day));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Bell className="h-4 w-4 text-muted-foreground" />
        <Label className="text-sm font-medium">Notification Preferences</Label>
      </div>
      
      <div className="space-y-3 pl-6">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Send reminders</Label>
          <div className="grid grid-cols-2 gap-2">
            {dayOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`day-${option.value}`}
                  checked={notificationDays.includes(option.value)}
                  onCheckedChange={(checked) => handleDayToggle(option.value, checked as boolean)}
                />
                <Label
                  htmlFor={`day-${option.value}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="email-notifications" className="text-sm font-medium">
                Email notifications
              </Label>
            </div>
            <Switch
              id="email-notifications"
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="push-notifications" className="text-sm font-medium">
                Push notifications
              </Label>
            </div>
            <Switch
              id="push-notifications"
              checked={pushNotifications}
              onCheckedChange={setPushNotifications}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPreferencesSection;
