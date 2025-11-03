import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Activity,
  ArrowRight,
  TrendingUp,
  Clock
} from 'lucide-react';
import { useAuth } from '@/contexts/auth';
import { useNavigate } from 'react-router-dom';
import { getSessionCount } from '@/services/security/SessionLimitService';
import { useSecurityAnomalies } from '@/hooks/useSecurityAnomalies';

export function SecurityDashboardWidget() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { anomalies, loading: anomaliesLoading } = useSecurityAnomalies(user?.id || '');
  const [sessionCount, setSessionCount] = useState(0);
  const [securityScore, setSecurityScore] = useState(0);

  useEffect(() => {
    loadSecurityData();
  }, [user]);

  const loadSecurityData = async () => {
    if (!user) return;
    
    // Get session count
    const count = await getSessionCount(user.id);
    setSessionCount(count);
    
    // Calculate security score
    calculateSecurityScore(count);
  };

  const calculateSecurityScore = (sessions: number) => {
    let score = 100;
    
    // Deduct for multiple sessions
    if (sessions > 3) score -= 10;
    if (sessions > 5) score -= 10;
    
    // Deduct for active anomalies
    const highRiskAnomalies = anomalies.filter(a => a.risk_score >= 70);
    score -= highRiskAnomalies.length * 15;
    
    // Deduct for medium risk anomalies
    const mediumRiskAnomalies = anomalies.filter(a => a.risk_score >= 40 && a.risk_score < 70);
    score -= mediumRiskAnomalies.length * 5;
    
    setSecurityScore(Math.max(0, score));
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  const highRiskAnomalies = anomalies.filter(a => a.risk_score >= 70);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Status
          </span>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/settings?tab=security')}
          >
            View Details
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Security Score */}
        <div className="p-4 rounded-lg bg-muted/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Security Score</span>
            <Badge variant={getScoreBadgeVariant(securityScore)}>
              {securityScore}/100
            </Badge>
          </div>
          <div className="w-full bg-border rounded-full h-2 overflow-hidden">
            <div 
              className={`h-full transition-all ${getScoreColor(securityScore).replace('text-', 'bg-')}`}
              style={{ width: `${securityScore}%` }}
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg border bg-card">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Active Sessions</span>
            </div>
            <p className="text-2xl font-bold">{sessionCount}</p>
          </div>
          
          <div className="p-3 rounded-lg border bg-card">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Alerts</span>
            </div>
            <p className="text-2xl font-bold">{highRiskAnomalies.length}</p>
          </div>
        </div>

        {/* Recent Alerts */}
        {highRiskAnomalies.length > 0 ? (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Recent Alerts
            </h4>
            {highRiskAnomalies.slice(0, 2).map((anomaly) => (
              <div 
                key={anomaly.id}
                className="p-3 rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950/20"
              >
                <p className="text-sm font-medium">
                  {anomaly.anomaly_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Risk Score: {anomaly.risk_score}/100
                </p>
              </div>
            ))}
            {highRiskAnomalies.length > 2 && (
              <Button 
                variant="link" 
                size="sm" 
                className="w-full"
                onClick={() => navigate('/settings?tab=security')}
              >
                View {highRiskAnomalies.length - 2} more
              </Button>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-900 dark:text-green-100">
                No security issues detected
              </span>
            </div>
          </div>
        )}

        {/* Security Tips */}
        {securityScore < 80 && (
          <div className="pt-3 border-t">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Improve Your Security
            </h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {sessionCount > 3 && (
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Sign out unused sessions</span>
                </li>
              )}
              {highRiskAnomalies.length > 0 && (
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Review security alerts</span>
                </li>
              )}
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Enable two-factor authentication</span>
              </li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
