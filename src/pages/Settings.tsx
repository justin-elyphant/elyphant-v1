
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SettingsLayout from "@/components/settings/SettingsLayout";
import GeneralSettings from "@/components/settings/GeneralSettings";
import PrivacySettings from "@/components/connections/PrivacySettings";
import NotificationSettings from "@/components/settings/NotificationSettings";

const Settings = () => {
  return (
    <SettingsLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Account Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>
        
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="w-full max-w-md grid grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-4 mt-6">
            <GeneralSettings />
          </TabsContent>
          
          <TabsContent value="privacy" className="space-y-4 mt-6">
            <PrivacySettings />
          </TabsContent>
          
          <TabsContent value="notifications" className="space-y-4 mt-6">
            <NotificationSettings />
          </TabsContent>
        </Tabs>
      </div>
    </SettingsLayout>
  );
};

export default Settings;
