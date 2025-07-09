
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { UserPlus, Zap, Plus } from "lucide-react";
import BudgetTrackingSection from "./BudgetTrackingSection";
import NotificationSettingsSection from "./NotificationSettingsSection";
import DefaultGiftSourceSection from "./DefaultGiftSourceSection";
import ActiveRulesSection from "./ActiveRulesSection";
import AutoGiftExecutionDashboard from "../../auto-execution/AutoGiftExecutionDashboard";
import AutoGiftSetupFlow from "../../auto-gift/AutoGiftSetupFlow";
import { useAutoGifting } from "@/hooks/useAutoGifting";
import { useAuth } from "@/contexts/auth";
import { useAutoGiftTrigger } from "@/hooks/useAutoGiftTrigger";

const AutomatedGiftingTabContent = () => {
  const { user } = useAuth();
  const { settings, rules, loading, updateSettings } = useAutoGifting();
  const { triggerAutoGiftProcessing, triggering } = useAutoGiftTrigger();
  const [setupDialogOpen, setSetupDialogOpen] = useState(false);

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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold mb-2">Automated Gifting Settings</h3>
          <p className="text-sm text-muted-foreground">
            Configure your preferences for automated gift-giving and manage your active rules
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => setSetupDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Auto-Gift Rule
          </Button>
          
          <Button 
            onClick={triggerAutoGiftProcessing}
            disabled={triggering}
            className="flex items-center gap-2"
            variant="outline"
          >
            <Zap className="h-4 w-4" />
            {triggering ? "Processing..." : "Trigger Auto-Gifts"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="executions" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="executions">Executions</TabsTrigger>
          <TabsTrigger value="settings">General Settings</TabsTrigger>
          <TabsTrigger value="budget">Budget Tracking</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="rules">Active Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="executions" className="space-y-4">
          <AutoGiftExecutionDashboard />
        </TabsContent>

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

      {/* Auto-Gift Setup Dialog */}
      <AutoGiftSetupFlow
        open={setupDialogOpen}
        onOpenChange={setSetupDialogOpen}
      />
    </div>
  );
};

export default AutomatedGiftingTabContent;
