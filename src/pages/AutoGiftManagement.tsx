import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gift, Plus, Settings, BarChart3 } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import AutoGiftSetupFlow from "@/components/gifting/auto-gift/AutoGiftSetupFlow";
import AutoGiftExecutionMonitor from "@/components/gifting/auto-gift/AutoGiftExecutionMonitor";
import { useAuth } from "@/contexts/auth";

const AutoGiftManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [setupDialogOpen, setSetupDialogOpen] = useState(false);

  if (!user) {
    return (
      <MainLayout>
        <div className="container max-w-4xl mx-auto py-8 px-4">
          <Card>
            <CardContent className="text-center py-12">
              <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Sign in required</h3>
              <p className="text-muted-foreground mb-4">
                Please sign in to manage your automated gifting
              </p>
              <Button onClick={() => navigate('/signin')}>
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Auto-Gift Management</h1>
            <p className="text-muted-foreground">
              Set up and monitor your automated gifting rules
            </p>
          </div>
          
          <Button onClick={() => setSetupDialogOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Auto-Gift Rule
          </Button>
        </div>

        <Tabs defaultValue="monitor" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="monitor" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Monitor Executions
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings & Rules
            </TabsTrigger>
          </TabsList>

          <TabsContent value="monitor" className="space-y-6">
            <AutoGiftExecutionMonitor />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Auto-Gift Settings</CardTitle>
                <CardDescription>
                  Configure your default preferences and manage active rules
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Settings interface coming soon. Use the existing Events tab for now.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/events?tab=automated')}
                  className="mt-4"
                >
                  Open Advanced Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <AutoGiftSetupFlow
          open={setupDialogOpen}
          onOpenChange={setSetupDialogOpen}
        />
      </div>
    </MainLayout>
  );
};

export default AutoGiftManagement;