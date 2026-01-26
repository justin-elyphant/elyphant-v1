
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { UserPlus, Zap, Plus } from "lucide-react";
import BudgetTrackingSection from "./BudgetTrackingSection";
import NotificationSettingsSection from "./NotificationSettingsSection";
import DefaultGiftSourceSection from "./DefaultGiftSourceSection";
import { GroupedRulesSection } from "@/components/gifting/unified/GroupedRulesSection";
import AutoGiftExecutionDashboard from "../../auto-execution/AutoGiftExecutionDashboard";
import AutoGiftExecutionProcessor from "@/components/auto-gifting/AutoGiftExecutionProcessor";
import AutoGiftSetupFlow from "../../auto-gift/AutoGiftSetupFlow";
import EnhancedCancellationTest from "@/components/auto-gifts/EnhancedCancellationTest";
import { useAutoGifting } from "@/hooks/useAutoGifting";
import { useAuth } from "@/contexts/auth";
import { useAutoGiftTrigger } from "@/hooks/useAutoGiftTrigger";

const AutomatedGiftingTabContent = () => {
  const { user } = useAuth();
  const { settings, rules, loading, updateSettings } = useAutoGifting();
  const { triggerAutoGiftProcessing, triggering } = useAutoGiftTrigger();
  const [setupDialogOpen, setSetupDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);

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
        <h3 className="text-xl font-semibold mb-2">Automation Rules</h3>
        <p className="text-sm text-muted-foreground">
          Create and manage rules for automated gift-giving based on your events and preferences
        </p>
      </div>
        
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => setSetupDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Automation Rule
          </Button>
          
          <Button 
            onClick={triggerAutoGiftProcessing}
            disabled={triggering}
            className="flex items-center gap-2"
            variant="outline"
          >
            <Zap className="h-4 w-4" />
            {triggering ? "Processing..." : "Run Auto-Gifts"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="rules" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="rules">My Rules</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="test">System Test</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          <GroupedRulesSection 
            rules={rules}
            title="My Recurring Gift Rules"
            description="View and manage your automated gift-giving rules"
            onEditRule={(ruleId) => {
              const rule = rules.find(r => r.id === ruleId);
              if (rule) {
                setEditingRule(rule);
                setSetupDialogOpen(true);
              }
            }}
          />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Default Preferences</CardTitle>
                <CardDescription>
                  Set default preferences that will be applied to new automation rules
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <DefaultGiftSourceSection 
                  settings={settings}
                  onUpdateSettings={updateSettings}
                />
              </CardContent>
            </Card>
            
            <BudgetTrackingSection 
              settings={settings}
              onUpdateSettings={updateSettings}
            />
            
            <NotificationSettingsSection 
              settings={settings}
              onUpdateSettings={updateSettings}
            />
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <AutoGiftExecutionProcessor className="mb-6" />
          <AutoGiftExecutionDashboard />
        </TabsContent>

        <TabsContent value="test" className="space-y-6">
          <div className="text-center mb-4">
            <h3 className="text-lg font-medium mb-2">Enhanced Cancellation System Test</h3>
            <p className="text-sm text-muted-foreground">
              Test all 4 phases of the enhanced cancel auto-gift system using your actual data
            </p>
          </div>
          <EnhancedCancellationTest />
        </TabsContent>
      </Tabs>

      {/* Auto-Gift Setup Dialog */}
      <AutoGiftSetupFlow
        open={setupDialogOpen}
        onOpenChange={(open) => {
          setSetupDialogOpen(open);
          if (!open) {
            setEditingRule(null);
          }
        }}
        initialData={editingRule?.initialData}
        ruleId={editingRule?.id}
      />
    </div>
  );
};

export default AutomatedGiftingTabContent;
