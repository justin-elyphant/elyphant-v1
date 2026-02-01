import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Heart, Calendar, ArrowRight, Settings, ShoppingBag, Gift, ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";
import { useAutoGifting } from "@/hooks/useAutoGifting";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { GroupedRulesSection } from "@/components/gifting/unified/GroupedRulesSection";
import AutoGiftSetupFlow from "@/components/gifting/auto-gift/AutoGiftSetupFlow";
import HowItWorksModal from "@/components/gifting/auto-gift/HowItWorksModal";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { triggerHapticFeedback } from "@/utils/haptics";
import { motion } from "framer-motion";
import RuleApprovalDialog from "@/components/gifting/auto-gift/RuleApprovalDialog";

const RecurringGifts = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { rules, loading } = useAutoGifting();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [setupDialogOpen, setSetupDialogOpen] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [approvalRuleId, setApprovalRuleId] = useState<string | null>(null);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');

  // Handle URL query parameters for email-based approvals
  useEffect(() => {
    const action = searchParams.get('action');
    const ruleId = searchParams.get('rule');

    if ((action === 'approve' || action === 'reject') && ruleId) {
      console.log(`🔗 Processing email approval link: action=${action}, rule=${ruleId}`);
      setApprovalRuleId(ruleId);
      setApprovalAction(action);
      setApprovalDialogOpen(true);
      
      // Clear the query params to prevent re-triggering
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Recurring Gifts...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-muted pb-safe">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 lg:pb-8 space-y-8">
        {/* Hero Section */}
        <div className="grid lg:grid-cols-2 gap-6 pt-4">
          {/* Left Side - Gradient Hero Card */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-purple-700 to-sky-500 border-0 text-white">
            <CardContent className="p-8 lg:p-10">
              <Badge className="bg-white/20 text-white border-0 mb-4 backdrop-blur-sm">
                POWERED BY NICOLE AI
              </Badge>
              <h1 className="text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                Recurring Gifts
              </h1>
              <p className="text-lg text-white/90 mb-6 leading-relaxed">
                Never miss a birthday, anniversary, or special occasion. Set up once and we'll handle everything automatically—gift selection, purchase, and delivery.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Primary CTA - Set Up Recurring Gift */}
                <motion.div whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
                  <Button 
                    onClick={() => {
                      triggerHapticFeedback('selection');
                      setEditingRule(null); // Ensure we're in create mode
                      setSetupDialogOpen(true);
                    }}
                    className="bg-white text-purple-700 hover:bg-white/90 min-h-[44px] font-semibold"
                  >
                    <Gift className="h-4 w-4 mr-2" />
                    Set Up Recurring Gift
                  </Button>
                </motion.div>
                
                {/* Secondary - Browse Products */}
                <motion.div whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
                  <Button 
                    onClick={() => {
                      triggerHapticFeedback('selection');
                      navigate('/marketplace');
                    }}
                    variant="ghost"
                    className="text-white hover:bg-white/10 min-h-[44px]"
                  >
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Browse Products
                  </Button>
                </motion.div>
              </div>
              
              <motion.div whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 25 }} className="mt-2">
                <Button 
                  onClick={() => {
                    triggerHapticFeedback('light');
                    setHowItWorksOpen(true);
                  }}
                  variant="link" 
                  className="text-white/80 hover:text-white p-0 h-auto"
                >
                  How It Works
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </motion.div>
            </CardContent>
          </Card>

          {/* Right Side - Welcome Card with Quick Rules View */}
          <Card className="bg-background">
            <CardContent className="p-6 lg:p-8">
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold mb-1">
                    Welcome back{profile?.name ? `, ${profile.name.split(' ')[0]}` : ''}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    You have <span className="font-semibold text-foreground">{rules.length}</span> active recurring gift {rules.length === 1 ? 'rule' : 'rules'}
                  </p>
                </div>

                {/* Quick Rules Preview */}
                <div className="space-y-2">
                  {rules.length > 0 ? (
                    <>
                      {rules.slice(0, 3).map((rule) => (
                        <motion.button
                          key={rule.id}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            triggerHapticFeedback('selection');
                            setEditingRule(rule);
                            setSetupDialogOpen(true);
                          }}
                          className="w-full flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left min-h-[44px]"
                        >
                          <div className="p-2 rounded-full bg-background">
                            <Gift className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {rule.recipient?.name || rule.pending_recipient_name || rule.pending_recipient_email || 'Recipient'}
                            </p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {rule.date_type?.replace('_', ' ')} • ${rule.budget_limit}
                            </p>
                          </div>
                          <Badge variant={rule.is_active ? "default" : "secondary"} className="text-xs shrink-0">
                            {rule.is_active ? 'Active' : 'Paused'}
                          </Badge>
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        </motion.button>
                      ))}
                      {rules.length > 3 && (
                        <p className="text-xs text-muted-foreground text-center pt-1">
                          +{rules.length - 3} more {rules.length - 3 === 1 ? 'rule' : 'rules'} below
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-6">
                      <div className="p-3 rounded-full bg-muted w-fit mx-auto mb-3">
                        <Gift className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        No recurring gifts set up yet
                      </p>
                      <Button
                        size="sm"
                        onClick={() => {
                          triggerHapticFeedback('selection');
                          setEditingRule(null);
                          setSetupDialogOpen(true);
                        }}
                        className="min-h-[44px]"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Rule
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Rules Section */}
        <GroupedRulesSection 
          rules={rules}
          title="Active Recurring Gift Rules"
          description="Manage your recurring gift rules"
          onEditRule={(ruleId) => {
            const rule = rules.find(r => r.id === ruleId);
            if (rule) {
              setEditingRule(rule);
              setSetupDialogOpen(true);
            }
          }}
        />

        {/* AI Settings Section */}
        <Card className="bg-background">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Settings className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg">Nicole AI Settings</CardTitle>
                <CardDescription>Customize how Nicole AI learns your preferences</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4 py-2">
              <div className="space-y-1 flex-1">
                <Label htmlFor="save-preferences" className="text-sm font-medium cursor-pointer">Save search preferences</Label>
                <p className="text-xs text-muted-foreground">Allow Nicole AI to remember your gift search patterns</p>
              </div>
              <div className="flex items-center justify-center min-w-[44px] min-h-[44px]">
                <Switch 
                  id="save-preferences" 
                  defaultChecked 
                  onCheckedChange={(checked) => {
                    triggerHapticFeedback('selection');
                    toast.success(checked ? "Search preferences enabled" : "Search preferences disabled");
                  }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 py-2">
              <div className="space-y-1 flex-1">
                <Label htmlFor="smart-suggestions" className="text-sm font-medium cursor-pointer">Smart suggestions</Label>
                <p className="text-xs text-muted-foreground">Get personalized gift recommendations based on your history</p>
              </div>
              <div className="flex items-center justify-center min-w-[44px] min-h-[44px]">
                <Switch 
                  id="smart-suggestions" 
                  defaultChecked 
                  onCheckedChange={(checked) => {
                    triggerHapticFeedback('selection');
                    toast.success(checked ? "Smart suggestions enabled" : "Smart suggestions disabled");
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>

      {/* Auto-Gift Setup Dialog (for editing existing rules) */}
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

      {/* Rule Approval Dialog (for email link approvals) */}
      <RuleApprovalDialog
        open={approvalDialogOpen}
        onOpenChange={(open) => {
          setApprovalDialogOpen(open);
          if (!open) {
            setApprovalRuleId(null);
          }
        }}
        ruleId={approvalRuleId}
        initialAction={approvalAction}
      />
    </SidebarLayout>
  );
};

export default RecurringGifts;
