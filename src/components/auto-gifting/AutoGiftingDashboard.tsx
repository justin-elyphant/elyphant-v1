import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Bot, Zap, Users, Gift, Plus, Settings, TrendingUp, Calendar, DollarSign } from "lucide-react";
import { useAutoGifting } from "@/hooks/useAutoGifting";
import { useAuth } from "@/contexts/auth";
import UnifiedGiftSchedulingModal from "@/components/gifting/unified/UnifiedGiftSchedulingModal";

const AutoGiftingDashboard = () => {
  const { user } = useAuth();
  const { rules, settings, loading } = useAutoGifting();
  const [showSetup, setShowSetup] = useState(false);

  if (!user) return null;

  const activeRulesCount = rules.filter(rule => rule.is_active).length;
  const totalBudget = rules.reduce((sum, rule) => sum + (rule.budget_limit || 0), 0);
  const upcomingGifts = rules.filter(rule => 
    rule.is_active && 
    rule.notification_preferences?.enabled
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Auto-Gifting</h1>
          <p className="text-muted-foreground">
            Smart, automated gift-giving for your special people
          </p>
        </div>
        <Button onClick={() => setShowSetup(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Set Up Auto-Gifting
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Gift className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Rules</p>
                <p className="text-2xl font-bold">{activeRulesCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Budget</p>
                <p className="text-2xl font-bold">${totalBudget}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Upcoming</p>
                <p className="text-2xl font-bold">{upcomingGifts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">94%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      {loading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-3/4 mx-auto" />
              <div className="h-4 bg-muted rounded w-1/2 mx-auto" />
            </div>
          </CardContent>
        </Card>
      ) : rules.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center mx-auto">
              <Gift className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Welcome to Auto-Gifting!</h3>
              <p className="text-muted-foreground mb-4">
                Never miss another birthday, anniversary, or special occasion. 
                Let us handle the perfect gift selection and delivery for you.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <Bot className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="font-medium">Nicole Setup</h4>
                <p className="text-sm text-muted-foreground">
                  AI-guided conversational setup
                </p>
              </div>
              
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Zap className="h-6 w-6 text-green-600" />
                </div>
                <h4 className="font-medium">Quick Setup</h4>
                <p className="text-sm text-muted-foreground">
                  Simple 3-step manual process
                </p>
              </div>
            </div>

            <Button onClick={() => setShowSetup(true)} size="lg" className="mt-6">
              Get Started with Auto-Gifting
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {/* Active Rules */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Active Auto-Gift Rules ({activeRulesCount})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {rules.filter(rule => rule.is_active).map((rule) => (
                <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Gift className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {rule.date_type} Gifts
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Budget: ${rule.budget_limit} • Source: {rule.gift_selection_criteria?.source}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Active</Badge>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Settings Summary */}
          {settings && (
            <Card>
              <CardHeader>
                <CardTitle>Your Auto-Gifting Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Default Budget</p>
                    <p className="font-medium">${settings.default_budget_limit}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Notifications</p>
                    <p className="font-medium">
                      {settings.email_notifications ? "Email" : ""}
                      {settings.email_notifications && settings.push_notifications ? " + " : ""}
                      {settings.push_notifications ? "Push" : ""}
                      {!settings.email_notifications && !settings.push_notifications ? "Disabled" : ""}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Auto-Approve</p>
                    <p className="font-medium">
                      {settings.auto_approve_gifts ? "Enabled" : "Manual Review"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Recurring Gift Setup */}
      <UnifiedGiftSchedulingModal 
        open={showSetup}
        onOpenChange={setShowSetup}
        standaloneMode={true}
      />
    </div>
  );
};

export default AutoGiftingDashboard;