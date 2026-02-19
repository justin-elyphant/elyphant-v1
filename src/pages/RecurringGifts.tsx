import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowRight, Settings, ShoppingBag, Gift } from "lucide-react";
import { toast } from "sonner";
import { useAutoGifting } from "@/hooks/useAutoGifting";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { GroupedRulesSection } from "@/components/gifting/unified/GroupedRulesSection";
import UnifiedGiftSchedulingModal from "@/components/gifting/unified/UnifiedGiftSchedulingModal";
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
        <div className="pt-4">
          <Card className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-purple-700 to-sky-500 border-0 text-white">
            <CardContent className="p-8 lg:p-10">
              <Badge className="bg-white/20 text-white border-0 mb-4 backdrop-blur-sm">
                POWERED BY NICOLE AI
              </Badge>
              <p className="text-white/80 text-sm font-medium mb-1 uppercase tracking-wide">Recurring Gifts</p>
              <h1 className="text-3xl lg:text-4xl font-bold mb-2 leading-tight">
                Welcome back{profile?.name ? `, ${profile.name.split(' ')[0]}` : ''}!
              </h1>
              <p className="text-white/90 mb-6 leading-relaxed">
                You have <span className="font-bold text-white">{rules.length}</span> active recurring gift {rules.length === 1 ? 'rule' : 'rules'}. Set up once and we'll handle everything automatically—gift selection, purchase, and delivery.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <motion.div whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
                  <Button 
                    onClick={() => {
                      triggerHapticFeedback('selection');
                      setEditingRule(null);
                      setSetupDialogOpen(true);
                    }}
                    className="bg-white text-purple-700 hover:bg-white/90 min-h-[44px] font-semibold"
                  >
                    <Gift className="h-4 w-4 mr-2" />
                    Set Up Recurring Gift
                  </Button>
                </motion.div>
                
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

                <motion.div whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
                  <Button 
                    onClick={() => {
                      triggerHapticFeedback('light');
                      setHowItWorksOpen(true);
                    }}
                    variant="ghost"
                    className="text-white/80 hover:text-white hover:bg-white/10 min-h-[44px]"
                  >
                    How It Works
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </motion.div>
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

      {/* Recurring Gift Setup Dialog */}
      <UnifiedGiftSchedulingModal
        open={setupDialogOpen}
        onOpenChange={(open) => {
          setSetupDialogOpen(open);
          if (!open) {
            setEditingRule(null);
          }
        }}
        standaloneMode={true}
        ruleId={editingRule?.id}
        editingRule={editingRule ? {
          id: editingRule.id,
          recipientId: editingRule.recipient_id || editingRule.pending_recipient_email,
          recipientName: editingRule.recipient?.name || editingRule.pending_recipient_name || editingRule.pending_recipient_email,
          eventType: editingRule.date_type,
          budgetLimit: editingRule.budget_limit,
          selectedPaymentMethodId: editingRule.payment_method_id,
          notificationDays: editingRule.notification_preferences?.days_before || [7, 3, 1],
          autoApprove: false,
          giftMessage: editingRule.gift_message || "",
          date_type: editingRule.date_type,
        } : undefined}
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
