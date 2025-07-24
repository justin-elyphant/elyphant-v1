import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, CheckCircle, XCircle, Bell, Settings, Monitor, Zap, Database, Server } from 'lucide-react';

interface MonitoringAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  service: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

interface MonitoringConfig {
  enableAlerts: boolean;
  errorThreshold: number;
  responseTimeThreshold: number;
  notificationChannels: string[];
  alertFrequency: string;
}

/**
 * TRUNKLINE MONITORING CENTER
 * 
 * Centralized monitoring and alerting system for all unified services.
 * 
 * Features:
 * - Real-time alert management
 * - Service health monitoring
 * - Custom alert thresholds
 * - Circuit breaker status
 * - Incident response tracking
 */
const TrunklineMonitoring: React.FC = () => {
  const [alerts, setAlerts] = useState<MonitoringAlert[]>([
    {
      id: '1',
      type: 'warning',
      service: 'MarketplaceService',
      message: 'Response time exceeded 400ms threshold (456ms)',
      timestamp: '2024-01-20T10:30:00Z',
      acknowledged: false
    },
    {
      id: '2',
      type: 'info',
      service: 'UnifiedPaymentService',
      message: 'Circuit breaker opened for Stripe webhook processing',
      timestamp: '2024-01-20T10:15:00Z',
      acknowledged: true
    },
    {
      id: '3',
      type: 'error',
      service: 'ZincAPIService',
      message: 'API rate limit exceeded - requests being throttled',
      timestamp: '2024-01-20T09:45:00Z',
      acknowledged: false
    }
  ]);

  const [config, setConfig] = useState<MonitoringConfig>({
    enableAlerts: true,
    errorThreshold: 5,
    responseTimeThreshold: 500,
    notificationChannels: ['email', 'slack'],
    alertFrequency: 'immediate'
  });

  const [circuitBreakers, setCircuitBreakers] = useState([
    { service: 'UnifiedPaymentService', status: 'closed', failureCount: 0, lastFailure: null },
    { service: 'UnifiedMessagingService', status: 'closed', failureCount: 0, lastFailure: null },
    { service: 'MarketplaceService', status: 'half-open', failureCount: 2, lastFailure: '2024-01-20T09:30:00Z' },
    { service: 'ZincAPIService', status: 'open', failureCount: 8, lastFailure: '2024-01-20T09:45:00Z' },
    { service: 'NicoleAIService', status: 'closed', failureCount: 0, lastFailure: null }
  ]);

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };

  const clearAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getAlertVariant = (type: string) => {
    switch (type) {
      case 'error': return 'destructive';
      case 'warning': return 'secondary';
      case 'info': return 'default';
      default: return 'outline';
    }
  };

  const getCircuitBreakerStatus = (status: string) => {
    switch (status) {
      case 'closed': return { color: 'bg-green-500', label: 'Closed (Healthy)' };
      case 'open': return { color: 'bg-red-500', label: 'Open (Failing)' };
      case 'half-open': return { color: 'bg-yellow-500', label: 'Half-Open (Testing)' };
      default: return { color: 'bg-gray-500', label: 'Unknown' };
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const unacknowledgedCount = alerts.filter(alert => !alert.acknowledged).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Monitoring Center</h1>
          <p className="text-muted-foreground">Real-time monitoring and alerting for all services</p>
        </div>
        <div className="flex items-center gap-2">
          {unacknowledgedCount > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              {unacknowledgedCount} unacknowledged
            </Badge>
          )}
          <Button variant="outline" size="sm">
            <Bell className="h-4 w-4 mr-2" />
            Configure Alerts
          </Button>
        </div>
      </div>

      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="alerts">Active Alerts</TabsTrigger>
          <TabsTrigger value="circuit-breakers">Circuit Breakers</TabsTrigger>
          <TabsTrigger value="health-checks">Health Checks</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Alerts</CardTitle>
              <CardDescription>System alerts and notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-lg font-medium">All systems operational</p>
                    <p className="text-muted-foreground">No active alerts</p>
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <Alert key={alert.id} className={alert.acknowledged ? 'opacity-60' : ''}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {getAlertIcon(alert.type)}
                          <div className="flex-1">
                            <AlertTitle className="flex items-center gap-2">
                              {alert.service}
                              <Badge variant={getAlertVariant(alert.type) as any}>
                                {alert.type}
                              </Badge>
                            </AlertTitle>
                            <AlertDescription className="mt-1">
                              {alert.message}
                            </AlertDescription>
                            <p className="text-xs text-muted-foreground mt-2">
                              {formatTimestamp(alert.timestamp)}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {!alert.acknowledged && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => acknowledgeAlert(alert.id)}
                            >
                              Acknowledge
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => clearAlert(alert.id)}
                          >
                            Clear
                          </Button>
                        </div>
                      </div>
                    </Alert>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="circuit-breakers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Circuit Breaker Status</CardTitle>
              <CardDescription>Protection mechanisms for external service dependencies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {circuitBreakers.map((breaker) => {
                  const status = getCircuitBreakerStatus(breaker.status);
                  return (
                    <div key={breaker.service} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${status.color}`} />
                        <div>
                          <p className="font-medium">{breaker.service}</p>
                          <p className="text-sm text-muted-foreground">{status.label}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-sm font-medium">{breaker.failureCount}</p>
                          <p className="text-xs text-muted-foreground">Failures</p>
                        </div>
                        {breaker.lastFailure && (
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {formatTimestamp(breaker.lastFailure)}
                            </p>
                            <p className="text-xs text-muted-foreground">Last failure</p>
                          </div>
                        )}
                        <Button variant="outline" size="sm">
                          Reset
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health-checks" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Database Health</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm">Connected</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Response time: 23ms
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Edge Functions</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm">Operational</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  12 functions deployed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Storage</CardTitle>
                <Server className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm">Available</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  89% capacity remaining
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="configuration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monitoring Configuration</CardTitle>
              <CardDescription>Configure alert thresholds and notification settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Alerts</Label>
                  <div className="text-sm text-muted-foreground">
                    Receive notifications when thresholds are exceeded
                  </div>
                </div>
                <Switch
                  checked={config.enableAlerts}
                  onCheckedChange={(checked) => 
                    setConfig(prev => ({ ...prev, enableAlerts: checked }))
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="error-threshold">Error Rate Threshold (%)</Label>
                  <Input
                    id="error-threshold"
                    type="number"
                    value={config.errorThreshold}
                    onChange={(e) => 
                      setConfig(prev => ({ ...prev, errorThreshold: Number(e.target.value) }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="response-threshold">Response Time Threshold (ms)</Label>
                  <Input
                    id="response-threshold"
                    type="number"
                    value={config.responseTimeThreshold}
                    onChange={(e) => 
                      setConfig(prev => ({ ...prev, responseTimeThreshold: Number(e.target.value) }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="alert-frequency">Alert Frequency</Label>
                <Select
                  value={config.alertFrequency}
                  onValueChange={(value) => 
                    setConfig(prev => ({ ...prev, alertFrequency: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate</SelectItem>
                    <SelectItem value="5min">Every 5 minutes</SelectItem>
                    <SelectItem value="15min">Every 15 minutes</SelectItem>
                    <SelectItem value="hourly">Hourly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end">
                <Button>Save Configuration</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TrunklineMonitoring;