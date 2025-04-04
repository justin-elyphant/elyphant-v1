
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useLocalStorage } from "@/components/gifting/hooks/useLocalStorage";
import { toast } from "sonner";

type NotificationSettingsType = {
  emailNotifications: boolean;
  newMessages: boolean;
  friendRequests: boolean;
  giftReminders: boolean;
  specialOffers: boolean;
  orderUpdates: boolean;
};

const defaultNotificationSettings: NotificationSettingsType = {
  emailNotifications: true,
  newMessages: true,
  friendRequests: true,
  giftReminders: true,
  specialOffers: false,
  orderUpdates: true,
};

const NotificationSettings = () => {
  const [settings, setSettings] = useLocalStorage<NotificationSettingsType>(
    "notificationSettings",
    defaultNotificationSettings
  );
  
  const [pendingSettings, setPendingSettings] = useState<NotificationSettingsType>(settings);
  
  useEffect(() => {
    setPendingSettings(settings);
  }, [settings]);
  
  const updateSetting = <K extends keyof NotificationSettingsType>(
    key: K,
    value: NotificationSettingsType[K]
  ) => {
    setPendingSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  const saveSettings = () => {
    setSettings(pendingSettings);
    toast.success("Notification settings saved successfully");
  };
  
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="font-medium">Email Notifications</p>
            <p className="text-sm text-muted-foreground">Receive notifications via email</p>
          </div>
          <Switch 
            checked={pendingSettings.emailNotifications}
            onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
          />
        </div>
        
        <div className="flex justify-between items-center">
          <div>
            <p className="font-medium">New Messages</p>
            <p className="text-sm text-muted-foreground">Get notified when you receive new messages</p>
          </div>
          <Switch 
            checked={pendingSettings.newMessages}
            onCheckedChange={(checked) => updateSetting('newMessages', checked)}
          />
        </div>
        
        <div className="flex justify-between items-center">
          <div>
            <p className="font-medium">Friend Requests</p>
            <p className="text-sm text-muted-foreground">Get notified when you receive friend requests</p>
          </div>
          <Switch 
            checked={pendingSettings.friendRequests}
            onCheckedChange={(checked) => updateSetting('friendRequests', checked)}
          />
        </div>
        
        <div className="flex justify-between items-center">
          <div>
            <p className="font-medium">Gift Reminders</p>
            <p className="text-sm text-muted-foreground">Receive reminders about upcoming gifts</p>
          </div>
          <Switch 
            checked={pendingSettings.giftReminders}
            onCheckedChange={(checked) => updateSetting('giftReminders', checked)}
          />
        </div>
        
        <div className="flex justify-between items-center">
          <div>
            <p className="font-medium">Special Offers</p>
            <p className="text-sm text-muted-foreground">Receive marketing emails about offers</p>
          </div>
          <Switch 
            checked={pendingSettings.specialOffers}
            onCheckedChange={(checked) => updateSetting('specialOffers', checked)}
          />
        </div>
        
        <div className="flex justify-between items-center">
          <div>
            <p className="font-medium">Order Updates</p>
            <p className="text-sm text-muted-foreground">Get notified about your order status</p>
          </div>
          <Switch 
            checked={pendingSettings.orderUpdates}
            onCheckedChange={(checked) => updateSetting('orderUpdates', checked)}
          />
        </div>
      </div>
      
      <Button className="w-full md:w-auto" onClick={saveSettings}>
        Save Notification Settings
      </Button>
    </div>
  );
};

export default NotificationSettings;
