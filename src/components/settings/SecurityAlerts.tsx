import { Shield, AlertTriangle, CheckCircle, X, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSecurityAnomalies } from '@/hooks/useSecurityAnomalies';
import { useAuth } from '@/contexts/auth/AuthProvider';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export const SecurityAlerts = () => {
  const { user } = useAuth();
  const { anomalies, loading, resolveAnomaly } = useSecurityAnomalies(user?.id);

  const getAnomalyIcon = (type: string) => {
    switch (type) {
      case 'device_change':
        return <Shield className="h-5 w-5" />;
      case 'location_change':
        return <AlertTriangle className="h-5 w-5" />;
      case 'concurrent_sessions':
        return <Info className="h-5 w-5" />;
      default:
        return <AlertTriangle className="h-5 w-5" />;
    }
  };

  const getAnomalyTitle = (type: string) => {
    switch (type) {
      case 'device_change':
        return 'New Device Detected';
      case 'location_change':
        return 'Location Change Detected';
      case 'unusual_time':
        return 'Unusual Login Time';
      case 'concurrent_sessions':
        return 'Multiple Active Sessions';
      case 'unusual_frequency':
        return 'Unusual Activity Frequency';
      case 'failed_login_attempts':
        return 'Failed Login Attempts';
      default:
        return 'Security Alert';
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 70) return 'destructive';
    if (score >= 40) return 'default';
    return 'secondary';
  };

  const handleResolve = async (anomalyId: string) => {
    try {
      await resolveAnomaly(anomalyId);
      toast.success('Alert dismissed');
    } catch (error) {
      toast.error('Failed to dismiss alert');
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-muted-foreground animate-pulse" />
          <div>
            <h3 className="font-semibold">Security Alerts</h3>
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (!anomalies || anomalies.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <div>
            <h3 className="font-semibold">Security Alerts</h3>
            <p className="text-sm text-muted-foreground">
              No security alerts. Your account looks secure.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <div>
              <h3 className="font-semibold">Security Alerts</h3>
              <p className="text-sm text-muted-foreground">
                {anomalies.length} active {anomalies.length === 1 ? 'alert' : 'alerts'}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {anomalies.map((anomaly) => (
            <div
              key={anomaly.id}
              className="flex items-start gap-3 p-4 rounded-lg border bg-card/50"
            >
              <div className="text-muted-foreground mt-0.5">
                {getAnomalyIcon(anomaly.anomaly_type)}
              </div>
              
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{getAnomalyTitle(anomaly.anomaly_type)}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(anomaly.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <Badge variant={getRiskColor(anomaly.risk_score)}>
                    Risk: {anomaly.risk_score}
                  </Badge>
                </div>

                {anomaly.details && (
                  <div className="text-sm text-muted-foreground space-y-1">
                    {anomaly.anomaly_type === 'device_change' && (
                      <>
                        <p>Previous: {anomaly.details.previous_device}</p>
                        <p>Current: {anomaly.details.current_device}</p>
                      </>
                    )}
                    {anomaly.anomaly_type === 'location_change' && (
                      <>
                        <p>Previous: {anomaly.details.previous_timezone}</p>
                        <p>Current: {anomaly.details.current_timezone}</p>
                      </>
                    )}
                    {anomaly.anomaly_type === 'concurrent_sessions' && (
                      <p>{anomaly.details.active_session_count} active sessions detected</p>
                    )}
                  </div>
                )}

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleResolve(anomaly.id)}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Dismiss
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
