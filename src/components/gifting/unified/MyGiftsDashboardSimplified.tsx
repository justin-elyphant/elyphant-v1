import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Bot, Calendar, Clock, Gift, Package, Settings, 
  CheckCircle, AlertCircle, Pause, Play, Edit, Trash2, Plus, Target 
} from "lucide-react";
import { format } from "date-fns";
import { useAutoGifting } from "@/hooks/useAutoGifting";
import { useAuth } from "@/contexts/auth";

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

  const activeRules = rules?.filter(rule => rule.is_active) || [];
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
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-primary">{activeRules.length}</p>
                <p className="text-sm text-muted-foreground">Auto-Gift Rules</p>
              </div>
              <Bot className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-primary">{scheduledGifts.length}</p>
                <p className="text-sm text-muted-foreground">Scheduled Gifts</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-primary">{giftHistory.length}</p>
                <p className="text-sm text-muted-foreground">Gifts Sent</p>
              </div>
              <Gift className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Unified Tracking View */}
      <div className="space-y-6">
        {/* Active Auto-Gift Rules */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-purple-500" />
                  Active Auto-Gift Rules
                </CardTitle>
                <CardDescription>
                  Quick edit and pause options for your automation rules
                </CardDescription>
              </div>
              <Button 
                size="sm" 
                onClick={onSwitchToSmartGifting}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Rule
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {activeRules.length > 0 ? (
              <div className="space-y-3">
                {activeRules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                        <Bot className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="font-medium">{rule.date_type}</p>
                        <p className="text-sm text-muted-foreground">
                          Budget: ${rule.budget_limit} • Source: {rule.gift_selection_criteria?.source || 'Wishlist'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor('active')}>
                        {getStatusIcon('active')}
                        <span className="ml-1">Active</span>
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onEditRule?.(rule.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                      >
                        <Pause className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground mb-4">No auto-gift rules set up yet</p>
                <Button onClick={onSwitchToSmartGifting}>
                  Create Your First Rule
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Scheduled Gifts with Delivery Tracking */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  Scheduled Gifts
                </CardTitle>
                <CardDescription>
                  Track delivery status and manage scheduled gifts
                </CardDescription>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={onScheduleGift}
                className="flex items-center gap-2"
              >
                <Calendar className="h-4 w-4" />
                Schedule Gift
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {scheduledGifts.length > 0 ? (
              <div className="space-y-3">
                {/* TODO: Map scheduled gifts with tracking info */}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground mb-4">No scheduled gifts</p>
                <Button variant="outline" onClick={onScheduleGift}>
                  Schedule a Gift
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-orange-500" />
              Activity Feed
            </CardTitle>
            <CardDescription>
              Recent automation executions and system activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No recent activity</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};