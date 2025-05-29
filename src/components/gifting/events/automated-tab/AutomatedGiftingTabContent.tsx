
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BudgetTrackingSection from "./BudgetTrackingSection";
import NotificationSettingsSection from "./NotificationSettingsSection";
import DefaultGiftSourceSection from "./DefaultGiftSourceSection";
import ActiveRulesSection from "./ActiveRulesSection";
import { useAutoGifting } from "@/hooks/useAutoGifting";
import { useAuth } from "@/contexts/auth";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { UserPlus } from "lucide-react";

const AutomatedGiftingTabContent = () => {
  const { user } = useAuth();
  const { settings, rules, loading, updateSettings } = useAutoGifting();

  if (!user) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Sign in required</h3>
            <p className="text-muted-foreground mb-4">
              Please sign in to manage your automated gifting preferences
            </p>
            <Button asChild>
              <Link to="/sign-in">Sign In</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading automated gifting settings...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-2">Automated Gifting Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure your preferences for automated gift-giving and manage your active rules
        </p>
      </div>

      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="settings">General Settings</TabsTrigger>
          <TabsTrigger value="budget">Budget Tracking</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="rules">Active Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Default Settings</CardTitle>
              <CardDescription>
                Set default preferences that will be applied to new auto-gifting rules
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <DefaultGiftSourceSection 
                settings={settings}
                onUpdateSettings={updateSettings}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budget" className="space-y-4">
          <BudgetTrackingSection 
            settings={settings}
            onUpdateSettings={updateSettings}
          />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <NotificationSettingsSection 
            settings={settings}
            onUpdateSettings={updateSettings}
          />
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <ActiveRulesSection rules={rules} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AutomatedGiftingTabContent;
