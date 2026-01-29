import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useAutoGiftTesting } from '@/hooks/useAutoGiftTesting';
import { Zap, PlayCircle, RefreshCw, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import OrderRecoveryTool from '@/components/admin/OrderRecoveryTool';

const AutoGiftTestingTab = () => {
  const {
    triggerDailyCheck,
    triggerProcessing,
    getExecutions,
    getEventLogs,
    getScheduledOrders,
    triggerScheduledProcessor,
    triggerOrchestrator,
    loading
  } = useAutoGiftTesting();

  const [userId, setUserId] = useState('');
  const [executions, setExecutions] = useState<any[]>([]);
  const [eventLogs, setEventLogs] = useState<any[]>([]);
  const [scheduledOrders, setScheduledOrders] = useState<any[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [simulatedDate, setSimulatedDate] = useState('');
  const [orchestratorDate, setOrchestratorDate] = useState('');

  const loadData = async () => {
    const [execData, logsData, ordersData] = await Promise.all([
      getExecutions(userId || undefined),
      getEventLogs(userId || undefined),
      getScheduledOrders()
    ]);
    setExecutions(execData);
    setEventLogs(logsData);
    setScheduledOrders(ordersData);
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(loadData, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, userId]);

  const handleDailyCheck = async () => {
    await triggerDailyCheck(userId || undefined);
    await loadData();
  };

  const handleProcessing = async () => {
    await triggerProcessing();
    await loadData();
  };

  const handleScheduledProcessor = async () => {
    await triggerScheduledProcessor(simulatedDate || undefined);
    await loadData();
  };

  const handleOrchestrator = async () => {
    await triggerOrchestrator(orchestratorDate || undefined);
    await loadData();
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      pending: { variant: 'secondary', icon: Clock },
      processing: { variant: 'default', icon: RefreshCw },
      approved: { variant: 'default', icon: CheckCircle2 },
      awaiting_address: { variant: 'outline', icon: AlertCircle },
      scheduled: { variant: 'secondary', icon: Clock },
      completed: { variant: 'default', icon: CheckCircle2 },
      failed: { variant: 'destructive', icon: AlertCircle }
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Auto-Gift Testing</h1>
        <p className="text-muted-foreground">
          Manual trigger controls and real-time monitoring for auto-gift workflows
        </p>
      </div>

      {/* Manual Trigger Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Manual Triggers
          </CardTitle>
          <CardDescription>
            Bypass cron schedules and trigger auto-gift processes immediately
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user-filter">User ID Filter (optional)</Label>
            <Input
              id="user-filter"
              placeholder="Enter user ID to test specific user..."
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleDailyCheck}
              disabled={loading}
              className="gap-2"
            >
              <PlayCircle className="h-4 w-4" />
              Create Executions
            </Button>

            <Button
              onClick={handleProcessing}
              disabled={loading}
              variant="secondary"
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Process Executions
            </Button>

            <Button
              onClick={loadData}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Data
            </Button>

            <Button
              onClick={() => setAutoRefresh(!autoRefresh)}
              variant={autoRefresh ? "default" : "outline"}
              className="gap-2"
            >
              {autoRefresh ? 'Auto-Refresh ON' : 'Auto-Refresh OFF'}
            </Button>

            <Separator orientation="vertical" className="h-8" />

            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={simulatedDate}
                onChange={(e) => setSimulatedDate(e.target.value)}
                className="w-40"
                placeholder="Simulate date"
              />
              <Button
                onClick={handleScheduledProcessor}
                disabled={loading}
                variant="secondary"
                className="gap-2"
              >
                <Clock className="h-4 w-4" />
                Run Scheduler
              </Button>
            </div>

            <Separator orientation="vertical" className="h-8" />

            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={orchestratorDate}
                onChange={(e) => setOrchestratorDate(e.target.value)}
                className="w-40"
                placeholder="Simulate date"
              />
              <Button
                onClick={handleOrchestrator}
                disabled={loading}
                variant="default"
                className="gap-2"
              >
                <Zap className="h-4 w-4" />
                Run Orchestrator
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Recovery Tool */}
      <OrderRecoveryTool />

      {/* Live Execution Monitor */}
      <Card>
        <CardHeader>
          <CardTitle>Live Execution Monitor</CardTitle>
          <CardDescription>
            Real-time view of automated gift executions ({executions.length} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {executions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No executions found. Click "Create Executions" to start.
                </p>
              ) : (
                executions.map((execution) => (
                  <div
                    key={execution.id}
                    className="border rounded-lg p-4 space-y-2 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {getStatusBadge(execution.status)}
                          <span className="text-sm font-mono text-muted-foreground">
                            {execution.id.slice(0, 8)}
                          </span>
                        </div>
                        <p className="text-sm font-medium">
                          {execution.profiles?.name || execution.profiles?.email || 'Unknown User'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {execution.auto_gifting_rules?.date_type || 'Unknown Event'} • 
                          Budget: ${execution.auto_gifting_rules?.budget_limit || 'N/A'}
                        </p>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <p>{format(new Date(execution.created_at), 'MMM d, h:mm a')}</p>
                        {execution.event_date && (
                          <p>Event: {format(new Date(execution.event_date), 'MMM d, yyyy')}</p>
                        )}
                      </div>
                    </div>
                    
                    {execution.pending_recipient_email && (
                      <Badge variant="outline" className="text-xs">
                        Pending: {execution.pending_recipient_email}
                      </Badge>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Event Log Viewer */}
        <Card>
          <CardHeader>
            <CardTitle>Event Logs</CardTitle>
            <CardDescription>
              Audit trail of all auto-gift events ({eventLogs.length} total)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {eventLogs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No event logs yet
                  </p>
                ) : (
                  eventLogs.map((log) => (
                    <div
                      key={log.id}
                      className="text-xs border-l-2 border-primary/20 pl-3 py-2 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {log.event_type}
                        </Badge>
                        <span className="text-muted-foreground">
                          {format(new Date(log.created_at), 'h:mm:ss a')}
                        </span>
                      </div>
                      {log.execution_id && (
                        <p className="font-mono text-muted-foreground">
                          Exec: {log.execution_id.slice(0, 8)}
                        </p>
                      )}
                      {log.event_data && (
                        <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                          {JSON.stringify(log.event_data, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Scheduled Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Scheduled Orders</CardTitle>
            <CardDescription>
              Orders held for future delivery ({scheduledOrders.length} total)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {scheduledOrders.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No scheduled orders
                  </p>
                ) : (
                  scheduledOrders.map((order) => (
                    <div
                      key={order.id}
                      className="border rounded-lg p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">
                          {order.shipping_address?.name || order.order_number || 'Unknown'}
                        </p>
                        {getStatusBadge(order.status)}
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>
                          Delivery: {order.scheduled_delivery_date 
                            ? format(new Date(order.scheduled_delivery_date), 'MMM d, yyyy')
                            : 'Not set'}
                        </p>
                        <p className="font-mono">Order #{order.order_number}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AutoGiftTestingTab;
