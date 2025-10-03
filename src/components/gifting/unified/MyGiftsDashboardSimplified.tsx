import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Bot, Calendar, Clock, Gift, Package, Settings, 
  CheckCircle, AlertCircle, Pause, Play, Edit, Trash2, Plus, Target,
  Mail, Info
} from "lucide-react";
import { format } from "date-fns";
import { useAutoGifting } from "@/hooks/useAutoGifting";
import { useAuth } from "@/contexts/auth";
import ScheduledGiftsSection from "@/components/gifting/sections/ScheduledGiftsSection";
import GiftActivityFeed from "@/components/gifting/sections/GiftActivityFeed";
import { BudgetEditor } from "./BudgetEditor";
import { 
  getRecipientDisplayName,
  isPendingInvitation
} from "@/utils/autoGiftDisplayHelpers";
import { toast } from "sonner";
import { RecipientGiftCard } from "./RecipientGiftCard";

interface MyGiftsDashboardSimplifiedProps {
  onEditRule?: (ruleId: string) => void;
  onScheduleGift?: () => void;
  onSwitchToSmartGifting?: () => void;
}

export const MyGiftsDashboardSimplified: React.FC<MyGiftsDashboardSimplifiedProps> = ({
  onEditRule,
  onScheduleGift,
  onSwitchToSmartGifting
}) => {
  const { user } = useAuth();
  const { rules, loading, updateRule, deleteRule, refreshData } = useAutoGifting();

  const handleToggleActive = async (ruleId: string, isActive: boolean) => {
    try {
      await updateRule(ruleId, { is_active: isActive });
      toast.success(isActive ? "Auto-gifting enabled" : "Auto-gifting paused");
    } catch (error) {
      toast.error("Failed to update. Please try again.");
    }
  };

  const handleBudgetUpdate = async (ruleId: string, newBudget: number) => {
    try {
      await updateRule(ruleId, { budget_limit: newBudget });
      toast.success(`Budget updated to $${newBudget}`);
      refreshData();
    } catch (error) {
      toast.error("Failed to update budget. Please try again.");
      throw error;
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm("Remove this auto-gift occasion? You can always set it up again later.")) {
      return;
    }
    
    try {
      await deleteRule(ruleId);
      toast.success("Occasion removed");
      refreshData();
    } catch (error) {
      toast.error("Failed to remove. Please try again.");
    }
  };

  // Group rules by recipient
  const groupedRules = React.useMemo(() => {
    const activeRules = rules?.filter(rule => rule.is_active) || [];
    const groups = new Map<string, typeof activeRules>();
    
    activeRules.forEach(rule => {
      const recipientKey = rule.recipient_id || rule.pending_recipient_email || 'unknown';
      if (!groups.has(recipientKey)) {
        groups.set(recipientKey, []);
      }
      groups.get(recipientKey)!.push(rule);
    });
    
    return Array.from(groups.entries()).map(([key, recipientRules]) => ({
      recipientKey: key,
      recipientName: getRecipientDisplayName(recipientRules[0]),
      isPending: isPendingInvitation(recipientRules[0]),
      recipientEmail: recipientRules[0].pending_recipient_email,
      recipientId: recipientRules[0].recipient_id,
      rules: recipientRules,
      totalBudget: recipientRules.reduce((sum, r) => sum + (r.budget_limit || 50), 0)
    }));
  }, [rules]);

  const scheduledGifts = []; // TODO: Integrate with actual scheduled gifts data
  const giftHistory = []; // TODO: Integrate with actual gift history

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-700';
      case 'paused': return 'bg-yellow-100 text-yellow-700';
      case 'scheduled': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Bot className="h-4 w-4" />;
      case 'paused': return <Pause className="h-4 w-4" />;
      case 'scheduled': return <Clock className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your gifts...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats - Mobile optimized */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        <Card className="mobile-card">
          <CardContent className="p-4 md:pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl md:text-2xl font-bold text-primary">{groupedRules.length}</p>
                <p className="text-xs md:text-sm text-muted-foreground">People Auto-Gifted</p>
              </div>
              <Bot className="h-6 w-6 md:h-8 md:w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="mobile-card">
          <CardContent className="p-4 md:pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl md:text-2xl font-bold text-primary">{scheduledGifts.length}</p>
                <p className="text-xs md:text-sm text-muted-foreground">Scheduled Gifts</p>
              </div>
              <Calendar className="h-6 w-6 md:h-8 md:w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="mobile-card">
          <CardContent className="p-4 md:pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl md:text-2xl font-bold text-primary">{giftHistory.length}</p>
                <p className="text-xs md:text-sm text-muted-foreground">Gifts Sent</p>
              </div>
              <Gift className="h-6 w-6 md:h-8 md:w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Unified Tracking View */}
      <div className="space-y-6">
        {/* Gift Autopilot */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-purple-500" />
                  🎁 Gift Autopilot
                </CardTitle>
                <CardDescription>
                  Your occasions are set up and ready to go automatically
                </CardDescription>
              </div>
              <Button 
                size="sm" 
                onClick={onSwitchToSmartGifting}
                className="flex items-center gap-2 min-h-[44px] marketplace-touch-target text-xs md:text-sm"
              >
                <Plus className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Set Up Another</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {groupedRules.length > 0 ? (
              <div className="space-y-3">
                {groupedRules.map((group) => (
                  <RecipientGiftCard
                    key={group.recipientKey}
                    recipientName={group.recipientName}
                    recipientId={group.recipientId}
                    recipientEmail={group.recipientEmail}
                    isPending={group.isPending}
                    rules={group.rules}
                    totalBudget={group.totalBudget}
                    onEditRule={onEditRule!}
                    onToggleRule={handleToggleActive}
                    onDeleteRule={handleDeleteRule}
                    onBudgetUpdate={handleBudgetUpdate}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-sm text-muted-foreground mb-2">Never forget a special occasion</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Set up auto-gifting and we'll handle the rest—on time, every time
                </p>
                <Button onClick={onSwitchToSmartGifting}>
                  Get Started
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Scheduled Gifts with Delivery Tracking */}
        <ScheduledGiftsSection 
          onScheduleNew={onScheduleGift}
          onTrackOrder={(orderId) => console.log('Track order:', orderId)}
          onCancelGift={(giftId) => console.log('Cancel gift:', giftId)}
        />

        {/* Recent Gift History with Reorder Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-emerald-500" />
              Recent Gift History
            </CardTitle>
            <CardDescription>
              Your recently sent gifts with reorder options
            </CardDescription>
          </CardHeader>
          <CardContent>
            {giftHistory.length > 0 ? (
              <div className="space-y-3">
                {/* TODO: Map gift history with reorder buttons */}
              </div>
            ) : (
              <div className="text-center py-8">
                <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground mb-4">No gift history yet</p>
                <p className="text-sm text-muted-foreground">
                  Your sent gifts will appear here for easy reordering
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <GiftActivityFeed 
          maxItems={15}
          showViewAll={true}
          onViewAll={() => console.log('View all activity')}
        />
      </div>
    </div>
  );
};