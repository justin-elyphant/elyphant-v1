
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Gift, Settings, TrendingUp, Zap } from "lucide-react";
import { useUnifiedGiftTiming } from "@/hooks/useUnifiedGiftTiming";
import { formatDistanceToNow } from "date-fns";
import AutomatedGiftExecutionsMonitor from "../automated/AutomatedGiftExecutionsMonitor";

const UnifiedGiftTimingDashboard = () => {
  const { scheduledGifts, upcomingReminders, loading, stats, refreshData } = useUnifiedGiftTiming();

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <Gift className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Total Scheduled</p>
              <p className="text-2xl font-bold">{stats.totalScheduled}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <Zap className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Recurring Gift Rules</p>
              <p className="text-2xl font-bold">{stats.automatedGifts}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <Calendar className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Manual Scheduled</p>
              <p className="text-2xl font-bold">{stats.manualScheduled}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <Clock className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Due This Week</p>
              <p className="text-2xl font-bold">{stats.upcomingInWeek}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Reminders */}
      {upcomingReminders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Upcoming Gift Reminders
            </CardTitle>
            <CardDescription>
              Gifts that need attention in the next 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingReminders.map((gift) => (
                <div key={gift.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant={gift.type === 'automated' ? 'default' : 'secondary'}>
                      {gift.type === 'automated' ? 'Auto-Gift' : 'Scheduled'}
                    </Badge>
                    <div>
                      <p className="font-medium">
                        {gift.eventType || 'Scheduled Gift'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Due {formatDistanceToNow(gift.scheduledDate, { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {gift.giftOptions.budget && (
                      <p className="text-sm font-medium">${gift.giftOptions.budget}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {gift.scheduledDate.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Automated Gift Executions Monitor */}
      <AutomatedGiftExecutionsMonitor />

      {/* System Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-600" />
              Automated Event Gifting
            </CardTitle>
            <CardDescription>
              Prevents forgotten gifts with rule-based automation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Active Rules:</span>
                <span className="font-medium">{stats.automatedGifts}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                • Event-triggered automation
                • Budget and notification controls
                • AI or wishlist-based selection
                • Production-ready execution engine
              </div>
              <Button variant="outline" size="sm" className="w-full">
                Manage Recurring Gifts
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              Manual Gift Scheduling
            </CardTitle>
            <CardDescription>
              Schedule delivery timing during checkout
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Scheduled Orders:</span>
                <span className="font-medium">{stats.manualScheduled}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                • User-initiated during checkout
                • Flexible delivery dates
                • Custom gift messages
                • Real Zinc API integration
              </div>
              <Button variant="outline" size="sm" className="w-full">
                View Scheduled Orders
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-center">
        <Button onClick={refreshData} variant="outline">
          Refresh Data
        </Button>
      </div>
    </div>
  );
};

export default UnifiedGiftTimingDashboard;
