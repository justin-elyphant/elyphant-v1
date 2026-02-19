import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type PreferenceKey =
  | "email_notifications"
  | "new_messages"
  | "connection_requests"
  | "gift_reminders"
  | "marketing"
  | "order_updates";

const EMAIL_TYPE_MAP: Record<PreferenceKey, string> = {
  email_notifications: "email_notifications",
  new_messages: "new_messages",
  connection_requests: "connection_requests",
  gift_reminders: "gift_reminders",
  marketing: "marketing",
  order_updates: "order_updates",
};

type NotificationSettingsType = Record<PreferenceKey, boolean>;

const defaultSettings: NotificationSettingsType = {
  email_notifications: true,
  new_messages: true,
  connection_requests: true,
  gift_reminders: true,
  marketing: false,
  order_updates: true,
};

const NotificationSettings = () => {
  const [settings, setSettings] = useState<NotificationSettingsType>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Load preferences from Supabase on mount
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUserId(user.id);

      const { data, error } = await supabase
        .from("email_preferences")
        .select("email_type, is_enabled")
        .eq("user_id", user.id);

      if (error) {
        console.error("Failed to load notification preferences:", error);
        setLoading(false);
        return;
      }

      if (data && data.length > 0) {
        const loaded = { ...defaultSettings };
        data.forEach((row) => {
          const key = row.email_type as PreferenceKey;
          if (key in loaded) {
            loaded[key] = row.is_enabled;
          }
        });
        setSettings(loaded);
      }
      setLoading(false);
    };
    load();
  }, []);

  const updateSetting = (key: PreferenceKey, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const saveSettings = async () => {
    if (!userId) {
      toast.error("You must be signed in to save preferences.");
      return;
    }

    setSaving(true);
    try {
      const upserts = (Object.keys(EMAIL_TYPE_MAP) as PreferenceKey[]).map((key) => ({
        user_id: userId,
        email_type: EMAIL_TYPE_MAP[key],
        is_enabled: settings[key],
      }));

      const { error } = await supabase
        .from("email_preferences")
        .upsert(upserts, { onConflict: "user_id,email_type" });

      if (error) throw error;
      toast.success("Notification settings saved successfully");
    } catch (err) {
      console.error("Failed to save notification preferences:", err);
      toast.error("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex justify-between items-center py-2">
            <div className="space-y-1">
              <div className="h-4 bg-muted rounded w-32" />
              <div className="h-3 bg-muted rounded w-48" />
            </div>
            <div className="h-6 w-11 bg-muted rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="font-medium">Email Notifications</p>
            <p className="text-sm text-muted-foreground">Receive notifications via email</p>
          </div>
          <Switch
            checked={settings.email_notifications}
            onCheckedChange={(checked) => updateSetting("email_notifications", checked)}
          />
        </div>

        <div className="flex justify-between items-center">
          <div>
            <p className="font-medium">New Messages</p>
            <p className="text-sm text-muted-foreground">Get notified when you receive new messages</p>
          </div>
          <Switch
            checked={settings.new_messages}
            onCheckedChange={(checked) => updateSetting("new_messages", checked)}
          />
        </div>

        <div className="flex justify-between items-center">
          <div>
            <p className="font-medium">Friend Requests</p>
            <p className="text-sm text-muted-foreground">Get notified when you receive friend requests</p>
          </div>
          <Switch
            checked={settings.connection_requests}
            onCheckedChange={(checked) => updateSetting("connection_requests", checked)}
          />
        </div>

        <div className="flex justify-between items-center">
          <div>
            <p className="font-medium">Gift Reminders</p>
            <p className="text-sm text-muted-foreground">Receive reminders about upcoming gifts</p>
          </div>
          <Switch
            checked={settings.gift_reminders}
            onCheckedChange={(checked) => updateSetting("gift_reminders", checked)}
          />
        </div>

        <div className="flex justify-between items-center">
          <div>
            <p className="font-medium">Special Offers</p>
            <p className="text-sm text-muted-foreground">Receive marketing emails about offers</p>
          </div>
          <Switch
            checked={settings.marketing}
            onCheckedChange={(checked) => updateSetting("marketing", checked)}
          />
        </div>

        <div className="flex justify-between items-center">
          <div>
            <p className="font-medium">Order Updates</p>
            <p className="text-sm text-muted-foreground">Get notified about your order status</p>
          </div>
          <Switch
            checked={settings.order_updates}
            onCheckedChange={(checked) => updateSetting("order_updates", checked)}
          />
        </div>
      </div>

      <Button className="w-full md:w-auto" onClick={saveSettings} disabled={saving}>
        {saving ? "Saving…" : "Save Notification Settings"}
      </Button>
    </div>
  );
};

export default NotificationSettings;
