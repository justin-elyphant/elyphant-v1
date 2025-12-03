import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus, Heart, Brain, Sparkles, Calendar, ArrowRight, Settings } from "lucide-react";
import { toast } from "sonner";
import { useAutoGifting } from "@/hooks/useAutoGifting";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/contexts/profile/ProfileContext";
import ActiveRulesSection from "@/components/gifting/events/automated-tab/ActiveRulesSection";
import AutoGiftSetupFlow from "@/components/gifting/auto-gift/AutoGiftSetupFlow";
import HowItWorksModal from "@/components/gifting/auto-gift/HowItWorksModal";
import { SidebarLayout } from "@/components/layout/SidebarLayout";

const AIGifting = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { rules, loading } = useAutoGifting();
  const [setupDialogOpen, setSetupDialogOpen] = useState(false);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading AI Gifting...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-muted pb-safe">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Section */}
        <div className="grid lg:grid-cols-2 gap-6 pt-4">
          {/* Left Side - Gradient Hero Card */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-purple-700 to-sky-500 border-0 text-white">
            <CardContent className="p-8 lg:p-10">
              <Badge className="bg-white/20 text-white border-0 mb-4 backdrop-blur-sm">
                SMART AUTOMATION
              </Badge>
              <h1 className="text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                AI Gifting
              </h1>
              <p className="text-lg text-white/90 mb-6 leading-relaxed">
                Never miss a birthday, anniversary, or special occasion. Our AI learns your connections' preferences and handles everything automatically.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={() => setSetupDialogOpen(true)}
                  className="bg-white text-purple-700 hover:bg-white/90 h-11 font-semibold"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {rules.length === 0 ? "Schedule Your First Gift" : "Schedule Another Gift"}
                </Button>
                <Button 
                  onClick={() => setHowItWorksOpen(true)}
                  variant="ghost" 
                  className="text-white hover:bg-white/10 h-11"
                >
                  How It Works
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Right Side - Welcome Card */}
          <Card className="bg-background">
            <CardContent className="p-8 lg:p-10">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">
                    Welcome back{profile?.name ? `, ${profile.name.split(' ')[0]}` : ''}
                  </h2>
                  <p className="text-muted-foreground">
                    You have <span className="font-semibold text-foreground">{rules.length}</span> active automation {rules.length === 1 ? 'rule' : 'rules'}
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 p-2 rounded-lg bg-muted">
                      <Heart className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm mb-1">Wishlist Intelligence</p>
                      <p className="text-xs text-muted-foreground">
                        We pull from your friends' wishlists for guaranteed-to-love gifts
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="mt-1 p-2 rounded-lg bg-muted">
                      <Brain className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm mb-1">Preference Learning</p>
                      <p className="text-xs text-muted-foreground">
                        Our AI learns interests, sizes, and styles for perfect matches
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="mt-1 p-2 rounded-lg bg-muted">
                      <Sparkles className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm mb-1">Set & Forget</p>
                      <p className="text-xs text-muted-foreground">
                        Create a rule once, we handle the rest forever
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="bg-background border">
            <CardContent className="p-6">
              <div className="mb-4 p-3 rounded-lg bg-muted w-fit">
                <Calendar className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Recurring Events</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Set up once for birthdays and anniversaries. We'll send the perfect gift every year, automatically.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-background border">
            <CardContent className="p-6">
              <div className="mb-4 p-3 rounded-lg bg-muted w-fit">
                <Heart className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Wishlist-Powered</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Our AI prioritizes items from their wishlist, ensuring they get exactly what they want.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-background border">
            <CardContent className="p-6">
              <div className="mb-4 p-3 rounded-lg bg-muted w-fit">
                <Brain className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Smart Budget Control</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Set spending limits and let our AI find the perfect gift within your budget range.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Active Rules Section */}
        <div className="pb-8">
          <ActiveRulesSection 
            rules={rules} 
            onEditRule={(rule) => {
              setEditingRule(rule);
              setSetupDialogOpen(true);
            }}
          />
        </div>

        {/* AI Settings Section */}
        <Card className="bg-background">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Settings className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg">AI Settings</CardTitle>
                <CardDescription>Customize how our AI learns your preferences</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="save-preferences" className="text-sm font-medium">Save search preferences</Label>
                <p className="text-xs text-muted-foreground">Allow AI to remember your gift search patterns</p>
              </div>
              <Switch 
                id="save-preferences" 
                defaultChecked 
                onCheckedChange={(checked) => {
                  toast.success(checked ? "Search preferences enabled" : "Search preferences disabled");
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="smart-suggestions" className="text-sm font-medium">Smart suggestions</Label>
                <p className="text-xs text-muted-foreground">Get personalized gift recommendations based on your history</p>
              </div>
              <Switch 
                id="smart-suggestions" 
                defaultChecked 
                onCheckedChange={(checked) => {
                  toast.success(checked ? "Smart suggestions enabled" : "Smart suggestions disabled");
                }}
              />
            </div>
          </CardContent>
        </Card>
        </div>
      </div>

      {/* Auto-Gift Setup Dialog */}
      <AutoGiftSetupFlow
        open={setupDialogOpen}
        onOpenChange={(open) => {
          setSetupDialogOpen(open);
          if (!open) {
            setEditingRule(null);
          }
        }}
        ruleId={editingRule?.id}
        initialData={editingRule ? {
          recipientId: editingRule.recipient_id || editingRule.pending_recipient_email,
          eventType: editingRule.date_type,
          budgetLimit: editingRule.budget_limit,
          selectedPaymentMethodId: editingRule.payment_method_id,
          emailNotifications: editingRule.notification_preferences?.email ?? true,
          notificationDays: editingRule.notification_preferences?.days_before || [7, 3, 1],
          autoApprove: false,
          giftMessage: editingRule.gift_message || ""
        } : undefined}
        onRequestEditRule={(rule) => {
          // Close current dialog and reopen with the selected rule
          setSetupDialogOpen(false);
          setEditingRule(rule);
          setTimeout(() => {
            setSetupDialogOpen(true);
          }, 100);
        }}
      />

      {/* How It Works Modal */}
      <HowItWorksModal
        open={howItWorksOpen}
        onOpenChange={setHowItWorksOpen}
      />
    </SidebarLayout>
  );
};

export default AIGifting;
