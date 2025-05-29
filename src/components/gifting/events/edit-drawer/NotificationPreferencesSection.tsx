
import React from "react";
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Bell, Mail, Smartphone } from "lucide-react";
import { UseFormReturn } from "react-hook-form";

interface NotificationPreferencesSectionProps {
  form: UseFormReturn<any>;
}

const NotificationPreferencesSection = ({ form }: NotificationPreferencesSectionProps) => {
  const dayOptions = [
    { value: 30, label: "30 days before" },
    { value: 14, label: "2 weeks before" },
    { value: 7, label: "1 week before" },
    { value: 3, label: "3 days before" },
    { value: 1, label: "1 day before" },
    { value: 0, label: "On the day" }
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium flex items-center">
        <Bell className="h-4 w-4 mr-2" />
        Notification Preferences
      </h3>
      
      <div className="space-y-3">
        <div className="space-y-2">
          <FormLabel className="text-sm font-medium">Send reminders</FormLabel>
          <div className="grid grid-cols-2 gap-2">
            {dayOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`day-${option.value}`}
                  defaultChecked={[7, 3, 1].includes(option.value)}
                />
                <FormLabel
                  htmlFor={`day-${option.value}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {option.label}
                </FormLabel>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <FormLabel className="text-sm font-medium">
                Email notifications
              </FormLabel>
            </div>
            <Switch defaultChecked={true} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <FormLabel className="text-sm font-medium">
                Push notifications
              </FormLabel>
            </div>
            <Switch defaultChecked={false} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPreferencesSection;
