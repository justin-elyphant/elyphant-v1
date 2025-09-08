import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Target, Bot, Gift, Settings, AlertCircle, CheckCircle, 
  Clock, Bell, Package, Zap 
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useGiftActivity } from '@/hooks/useGiftActivity';

interface GiftActivityFeedProps {
  maxItems?: number;
  showViewAll?: boolean;
  onViewAll?: () => void;
}

const GiftActivityFeed: React.FC<GiftActivityFeedProps> = ({
  maxItems = 10,
  showViewAll = true,
  onViewAll
}) => {
  const { activities, loading, error } = useGiftActivity();

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'auto_gift_executed': return <Bot className="h-4 w-4" />;
      case 'manual_gift_sent': return <Gift className="h-4 w-4" />;
      case 'rule_created': return <Settings className="h-4 w-4" />;
      case 'rule_updated': return <Settings className="h-4 w-4" />;
      case 'execution_failed': return <AlertCircle className="h-4 w-4" />;
      case 'notification_sent': return <Bell className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getActivityColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'failed': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      case 'pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'info': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getIconColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 dark:text-green-400';
      case 'failed': return 'text-red-600 dark:text-red-400';
      case 'pending': return 'text-yellow-600 dark:text-yellow-400';
      case 'info': return 'text-blue-600 dark:text-blue-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-orange-500" />
            Activity Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start gap-3 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-1" />
                  <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-orange-500" />
            Activity Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayedActivities = activities.slice(0, maxItems);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-orange-500" />
              Activity Feed
            </CardTitle>
            <CardDescription>
              Recent automation executions and system activity
            </CardDescription>
          </div>
          {showViewAll && activities.length > maxItems && (
            <Button variant="ghost" size="sm" onClick={onViewAll}>
              View All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {displayedActivities.length > 0 ? (
          <div className="space-y-4">
            {displayedActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className={`p-2 rounded-full ${getActivityColor(activity.status)}`}>
                  <div className={getIconColor(activity.status)}>
                    {getActivityIcon(activity.type)}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm">{activity.title}</h4>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${getActivityColor(activity.status)}`}
                    >
                      {activity.status}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-1">
                    {activity.description}
                  </p>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span title={format(new Date(activity.timestamp), 'PPpp')}>
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </span>
                    
                    {activity.metadata?.amount && (
                      <>
                        <span>•</span>
                        <span>${activity.metadata.amount}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {activities.length > maxItems && (
              <div className="text-center pt-2">
                <p className="text-sm text-muted-foreground">
                  +{activities.length - maxItems} more activities
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No recent activity</h3>
            <p className="text-muted-foreground text-sm">
              Your gift activity will appear here as you use the system
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GiftActivityFeed;