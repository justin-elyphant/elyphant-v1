import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Bot, Calendar, Gift, Plus } from "lucide-react";
import { useAutoGifting } from "@/hooks/useAutoGifting";
import { useAuth } from "@/contexts/auth";
import ScheduledGiftsSection from "@/components/gifting/sections/ScheduledGiftsSection";
import GiftActivityFeed from "@/components/gifting/sections/GiftActivityFeed";
import { GroupedRulesSection } from "./GroupedRulesSection";

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
  const { rules, loading } = useAutoGifting();

  // Refs for smooth scrolling to sections
  const autopilotRef = React.useRef<HTMLDivElement>(null);
  const scheduledRef = React.useRef<HTMLDivElement>(null);
  const historyRef = React.useRef<HTMLDivElement>(null);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Count active rules for stats
  const activeRulesCount = React.useMemo(() => {
    const activeRules = rules?.filter(rule => rule.is_active) || [];
    const groups = new Set<string>();
    activeRules.forEach(rule => {
      groups.add(rule.recipient_id || rule.pending_recipient_email || 'unknown');
    });
    return groups.size;
  }, [rules]);

  const scheduledGifts = []; // TODO: Integrate with actual scheduled gifts data
  const giftHistory = []; // TODO: Integrate with actual gift history

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
      {/* Quick Stats - Mobile optimized with clickable navigation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card 
                className="mobile-card cursor-pointer transition-all hover:scale-105 hover:border-primary hover:shadow-lg"
                onClick={() => scrollToSection(autopilotRef)}
              >
                <CardContent className="p-4 md:pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xl md:text-2xl font-bold text-primary">{activeRulesCount}</p>
                      <p className="text-xs md:text-sm text-muted-foreground">People Auto-Gifted</p>
                    </div>
                    <Bot className="h-6 w-6 md:h-8 md:w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p>View your active auto-gift rules below</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card 
                className="mobile-card cursor-pointer transition-all hover:scale-105 hover:border-primary hover:shadow-lg"
                onClick={() => scrollToSection(scheduledRef)}
              >
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
            </TooltipTrigger>
            <TooltipContent>
              <p>Click to see upcoming deliveries</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card 
                className="mobile-card cursor-pointer transition-all hover:scale-105 hover:border-primary hover:shadow-lg"
                onClick={() => scrollToSection(historyRef)}
              >
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
            </TooltipTrigger>
            <TooltipContent>
              <p>Click to see your gift history</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Unified Tracking View */}
      <div className="space-y-6">
        {/* Gift Autopilot */}
        <Card ref={autopilotRef}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-purple-500" />
                  🎁 Recurring Gifts
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
            {rules && rules.filter(r => r.is_active).length > 0 ? (
              <GroupedRulesSection 
                rules={rules}
                activeOnly={true}
                showEmptyState={false}
                onEditRule={onEditRule}
              />
            ) : (
              <div className="text-center py-8">
                <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-sm text-muted-foreground mb-2">Never forget a special occasion</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Set up recurring gifts and we'll handle the rest—on time, every time
                </p>
                <Button onClick={onSwitchToSmartGifting}>
                  Get Started
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Scheduled Gifts with Delivery Tracking */}
        <div ref={scheduledRef}>
          <ScheduledGiftsSection
          onScheduleNew={onScheduleGift}
          onTrackOrder={(orderId) => console.log('Track order:', orderId)}
          onCancelGift={(giftId) => console.log('Cancel gift:', giftId)}
          />
        </div>

        {/* Recent Gift History with Reorder Options */}
        <Card ref={historyRef}>
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