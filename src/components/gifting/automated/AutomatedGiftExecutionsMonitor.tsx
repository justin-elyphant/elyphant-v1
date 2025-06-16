
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw, Play } from "lucide-react";
import { unifiedGiftTimingService, AutomatedGiftExecution } from "@/services/unifiedGiftTimingService";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const AutomatedGiftExecutionsMonitor = () => {
  const { user } = useAuth();
  const [executions, setExecutions] = useState<AutomatedGiftExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadExecutions = async () => {
    if (!user?.id) return;

    try {
      setRefreshing(true);
      const data = await unifiedGiftTimingService.getAutomatedGiftExecutions(user.id);
      setExecutions(data);
    } catch (error) {
      console.error('Error loading automated gift executions:', error);
      toast.error('Failed to load automated gift executions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadExecutions();
  }, [user?.id]);

  const handleApprove = async (executionId: string) => {
    try {
      await unifiedGiftTimingService.approveAutomatedGift(executionId);
      toast.success('Automated gift approved and processing started');
      await loadExecutions();
    } catch (error) {
      console.error('Error approving automated gift:', error);
      toast.error('Failed to approve automated gift');
    }
  };

  const handleCancel = async (executionId: string) => {
    try {
      await unifiedGiftTimingService.cancelAutomatedGift(executionId);
      toast.success('Automated gift cancelled');
      await loadExecutions();
    } catch (error) {
      console.error('Error cancelling automated gift:', error);
      toast.error('Failed to cancel automated gift');
    }
  };

  const handleTriggerProcessor = async () => {
    try {
      await unifiedGiftTimingService.triggerAutomatedGiftProcessor();
      toast.success('Automated gift processor triggered');
      await loadExecutions();
    } catch (error) {
      console.error('Error triggering processor:', error);
      toast.error('Failed to trigger automated gift processor');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'processing':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'failed':
        return 'destructive';
      case 'processing':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'cancelled':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const pendingApprovals = executions.filter(e => e.status === 'pending');

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          Loading automated gift executions...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Approvals Alert */}
      {pendingApprovals.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You have {pendingApprovals.length} automated gift{pendingApprovals.length === 1 ? '' : 's'} waiting for approval.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Automated Gift Executions</CardTitle>
              <CardDescription>
                Monitor and manage your automated gift purchases
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTriggerProcessor}
                disabled={refreshing}
              >
                <Play className="h-4 w-4 mr-2" />
                Test Processor
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={loadExecutions}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {executions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No automated gift executions yet
            </div>
          ) : (
            <div className="space-y-4">
              {executions.map((execution) => (
                <div key={execution.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(execution.status)}
                      <Badge variant={getStatusColor(execution.status) as any}>
                        {execution.status}
                      </Badge>
                      <span className="font-medium">
                        {formatDistanceToNow(execution.execution_date, { addSuffix: true })}
                      </span>
                    </div>
                    {execution.total_amount && (
                      <span className="font-semibold">
                        ${execution.total_amount.toFixed(2)}
                      </span>
                    )}
                  </div>

                  {execution.selected_products && (
                    <div className="mb-3">
                      <span className="text-sm font-medium">Selected Products:</span>
                      <ul className="text-sm text-muted-foreground mt-1">
                        {execution.selected_products.map((product, index) => (
                          <li key={index}>
                            • {product.name} - ${product.price}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {execution.error_message && (
                    <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                      {execution.error_message}
                    </div>
                  )}

                  {execution.status === 'pending' && (
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(execution.id)}
                      >
                        Approve & Purchase
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancel(execution.id)}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AutomatedGiftExecutionsMonitor;
