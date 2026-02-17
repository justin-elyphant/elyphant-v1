import React, { useState, useEffect } from 'react';
import { useZmaOrderSecurity } from '@/hooks/useZmaOrderSecurity';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Shield, AlertTriangle, CheckCircle, XCircle, DollarSign, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice } from "@/lib/utils";

interface ZmaSecurityStatusProps {
  userId?: string;
  showDetails?: boolean;
}

const ZmaSecurityStatus: React.FC<ZmaSecurityStatusProps> = ({ 
  userId, 
  showDetails = false 
}) => {
  const { rateLimitStatus, costStatus, getSecurityStatusSummary } = useZmaOrderSecurity();
  const [securitySummary, setSecuritySummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSecurityStatus = async () => {
      if (!userId) {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        userId = user.id;
      }

      try {
        const summary = await getSecurityStatusSummary(userId);
        setSecuritySummary(summary);
      } catch (error) {
        console.error('Failed to load security status:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSecurityStatus();
  }, [userId, getSecurityStatusSummary]);

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4 animate-pulse" />
            <span>Loading security status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getSecurityIcon = () => {
    if (rateLimitStatus.isLimited) return <XCircle className="h-5 w-5 text-destructive" />;
    if (costStatus.isNearLimit) return <AlertTriangle className="h-5 w-5 text-warning" />;
    return <CheckCircle className="h-5 w-5 text-success" />;
  };

  const getSecurityStatus = () => {
    if (rateLimitStatus.isLimited) return 'Limited';
    if (costStatus.isNearLimit) return 'Warning';
    return 'Good';
  };

  const getSecurityStatusColor = () => {
    if (rateLimitStatus.isLimited) return 'destructive';
    if (costStatus.isNearLimit) return 'secondary';
    return 'default';
  };

  return (
    <div className="space-y-4">
      {/* Main Status Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">ZMA Security Status</CardTitle>
          {getSecurityIcon()}
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Badge variant={getSecurityStatusColor()}>
              {getSecurityStatus()}
            </Badge>
            {rateLimitStatus.isLimited && (
              <span className="text-sm text-muted-foreground">
                Reset: {rateLimitStatus.resetTime?.toLocaleDateString()}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Status */}
      {showDetails && (
        <>
          {/* Rate Limits */}
          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <Clock className="h-4 w-4 mr-2" />
              <CardTitle className="text-sm font-medium">Order Limits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Daily Orders</span>
                    <span>{rateLimitStatus.ordersToday}/50</span>
                  </div>
                  <Progress 
                    value={(rateLimitStatus.ordersToday / 50) * 100} 
                    className="mt-1"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Hourly Orders</span>
                    <span>{rateLimitStatus.ordersThisHour}/10</span>
                  </div>
                  <Progress 
                    value={(rateLimitStatus.ordersThisHour / 10) * 100} 
                    className="mt-1"
                  />
                </div>
                {rateLimitStatus.consecutiveFailures > 0 && (
                  <div className="text-sm text-warning">
                    Consecutive failures: {rateLimitStatus.consecutiveFailures}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Cost Limits */}
          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <DollarSign className="h-4 w-4 mr-2" />
              <CardTitle className="text-sm font-medium">Spending Limits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Daily Spending</span>
                    <span>{formatPrice(costStatus.dailySpent)}/${costStatus.dailyLimit}</span>
                  </div>
                  <Progress 
                    value={(costStatus.dailySpent / costStatus.dailyLimit) * 100} 
                    className="mt-1"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Monthly Spending</span>
                    <span>{formatPrice(costStatus.monthlySpent)}/${costStatus.monthlyLimit}</span>
                  </div>
                  <Progress 
                    value={(costStatus.monthlySpent / costStatus.monthlyLimit) * 100} 
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Security Events */}
          {securitySummary?.recentEvents && securitySummary.recentEvents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Recent Security Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {securitySummary.recentEvents.slice(0, 5).map((event: any, index: number) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="capitalize">
                        {event.event_type.replace('_', ' ')}
                      </span>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={
                            event.severity === 'critical' ? 'destructive' : 
                            event.severity === 'warning' ? 'secondary' : 'default'
                          }
                        >
                          {event.severity}
                        </Badge>
                        <span className="text-muted-foreground">
                          {new Date(event.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Warnings and Errors */}
      {rateLimitStatus.isLimited && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Your ZMA order processing is currently limited. 
            {rateLimitStatus.resetTime && (
              <> Limits will reset on {rateLimitStatus.resetTime.toLocaleDateString()}.</>
            )}
          </AlertDescription>
        </Alert>
      )}

      {costStatus.isNearLimit && (
        <Alert>
          <DollarSign className="h-4 w-4" />
          <AlertDescription>
            You're approaching your spending limits. Please monitor your budget to avoid interruptions.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default ZmaSecurityStatus;