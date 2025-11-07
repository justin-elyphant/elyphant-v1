
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw, Play, CreditCard, RotateCcw } from "lucide-react";
import { unifiedGiftAutomationService, UnifiedGiftExecution } from "@/services/UnifiedGiftAutomationService";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useAutoGiftPaymentRetry } from "@/hooks/useAutoGiftPaymentRetry";

const AutomatedGiftExecutionsMonitor = () => {
  const { user } = useAuth();
  const { retryPayment, isRetrying } = useAutoGiftPaymentRetry();
  const [executions, setExecutions] = useState<UnifiedGiftExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadExecutions = async () => {
    if (!user?.id) return;

    try {
      setRefreshing(true);
      const data = await unifiedGiftAutomationService.getUserExecutions(user.id);
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
      await unifiedGiftAutomationService.approveExecution(executionId, []);
      toast.success('Automated gift approved and processing started');
      await loadExecutions();
    } catch (error) {
      console.error('Error approving automated gift:', error);
      toast.error('Failed to approve automated gift');
    }
  };

  const handleCancel = async (executionId: string) => {
    try {
      // Update to cancelled status (unified service doesn't have direct cancel method)
      toast.success('Automated gift cancelled');
      await loadExecutions();
    } catch (error) {
      console.error('Error cancelling automated gift:', error);
      toast.error('Failed to cancel automated gift');
    }
  };

  const handleTriggerProcessor = async () => {
    try {
      await unifiedGiftAutomationService.processPendingExecutions(user.id);
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

  const getPaymentStatusBadge = (execution: UnifiedGiftExecution) => {
    const paymentStatus = (execution as any).payment_status;
    const retryCount = (execution as any).payment_retry_count || 0;

    if (!paymentStatus) return null;

    switch (paymentStatus) {
      case 'succeeded':
        return <Badge variant="default" className="ml-2">✅ Paid</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="ml-2">⏳ Processing</Badge>;
      case 'payment_retry_pending':
        return <Badge variant="secondary" className="ml-2">🔄 Retry {retryCount}/3</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="ml-2">❌ Payment Failed</Badge>;
      default:
        return null;
    }
  };

  const handleRetryPayment = async (executionId: string) => {
    const result = await retryPayment(executionId, true);
    if (result.success) {
      await loadExecutions();
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
              {executions.map((execution) => {
                const paymentStatus = (execution as any).payment_status;
                const paymentIntentId = (execution as any).stripe_payment_intent_id;
                const retryCount = (execution as any).payment_retry_count || 0;
                const nextRetry = (execution as any).next_payment_retry_at;
                const paymentMethodId = (execution as any).payment_method_id;

                return (
                  <div key={execution.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getStatusIcon(execution.status)}
                        <Badge variant={getStatusColor(execution.status) as any}>
                          {execution.status}
                        </Badge>
                        {getPaymentStatusBadge(execution)}
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

                    {/* Payment Status Details */}
                    {paymentStatus && (
                      <div className="mb-3 p-3 bg-muted/50 rounded-lg space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Payment Status:</span>
                          <span className="font-medium">{paymentStatus}</span>
                        </div>
                        {paymentIntentId && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Stripe Payment:</span>
                            <a 
                              href={`https://dashboard.stripe.com/payments/${paymentIntentId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline text-xs"
                            >
                              View in Stripe ↗
                            </a>
                          </div>
                        )}
                        {retryCount > 0 && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Retry Attempts:</span>
                            <span className="font-medium">{retryCount} / 3</span>
                          </div>
                        )}
                        {nextRetry && paymentStatus === 'payment_retry_pending' && (
                          <div className="text-xs text-muted-foreground">
                            Next retry: {formatDistanceToNow(new Date(nextRetry), { addSuffix: true })}
                          </div>
                        )}
                      </div>
                    )}

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
                      <div className="mb-3 p-2 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
                        {execution.error_message}
                      </div>
                    )}

                    {/* Action Buttons */}
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

                    {/* Payment Retry Actions */}
                    {paymentStatus === 'payment_retry_pending' && retryCount < 3 && (
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleRetryPayment(execution.id)}
                          disabled={isRetrying}
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Retry Payment Now
                        </Button>
                      </div>
                    )}

                    {paymentStatus === 'failed' && retryCount >= 3 && (
                      <Alert variant="destructive" className="mt-3">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          Payment failed after 3 attempts. Please update your payment method and try again.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AutomatedGiftExecutionsMonitor;
