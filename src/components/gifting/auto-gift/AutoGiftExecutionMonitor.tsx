import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Gift, Clock, CheckCircle, XCircle, AlertTriangle, 
  Eye, RefreshCw, DollarSign, Calendar, Zap 
} from "lucide-react";
import { useAutoGiftExecution } from "@/hooks/useAutoGiftExecution";
import { format, formatDistanceToNow } from "date-fns";
import GiftApprovalSystem from "./GiftApprovalSystem";
import { toast } from "sonner";

const AutoGiftExecutionMonitor = () => {
  const { executions, loading, processing, processPendingExecutions, approveExecution } = useAutoGiftExecution();
  const [selectedExecution, setSelectedExecution] = useState<any>(null);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);

  const pendingExecutions = executions.filter(exec => exec.status === 'pending' && exec.selected_products?.length > 0);
  const processingExecutions = executions.filter(exec => exec.status === 'processing');
  const completedExecutions = executions.filter(exec => exec.status === 'completed');
  const failedExecutions = executions.filter(exec => exec.status === 'failed');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'processing':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'yellow';
      case 'processing':
        return 'blue';
      case 'completed':
        return 'green';
      case 'failed':
        return 'red';
      case 'cancelled':
        return 'gray';
      default:
        return 'gray';
    }
  };

  const handleReviewExecution = (execution: any) => {
    setSelectedExecution(execution);
    setApprovalModalOpen(true);
  };

  const handleApproveProducts = async (executionId: string, selectedProductIds: string[], message?: string) => {
    try {
      await approveExecution(executionId, selectedProductIds);
      toast.success("Gift approval processed successfully");
      setSelectedExecution(null);
    } catch (error) {
      console.error('Error approving products:', error);
      toast.error("Failed to approve gifts");
    }
  };

  const handleRejectProducts = async (executionId: string, reason?: string) => {
    try {
      // TODO: Implement reject functionality in the hook
      console.log('Rejecting execution:', executionId, 'Reason:', reason);
      toast.success("Gift suggestions rejected");
      setSelectedExecution(null);
    } catch (error) {
      console.error('Error rejecting products:', error);
      toast.error("Failed to reject gifts");
    }
  };

  const ExecutionCard = ({ execution, showActions = true }: { execution: any; showActions?: boolean }) => (
    <Card key={execution.id} className="transition-all duration-200 hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {getStatusIcon(execution.status)}
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">Auto-gift for {execution.event_type || 'event'}</p>
                <Badge variant="outline" className={`text-${getStatusColor(execution.status)}-700 bg-${getStatusColor(execution.status)}-50`}>
                  {execution.status.charAt(0).toUpperCase() + execution.status.slice(1)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(execution.execution_date), { addSuffix: true })}
              </p>
            </div>
          </div>
          
          {execution.total_amount && (
            <div className="text-right">
              <div className="flex items-center gap-1 text-lg font-semibold">
                <DollarSign className="h-4 w-4" />
                {execution.total_amount.toFixed(2)}
              </div>
            </div>
          )}
        </div>

        {execution.selected_products && execution.selected_products.length > 0 && (
          <div className="mb-3">
            <p className="text-sm font-medium mb-2">
              {execution.selected_products.length} product{execution.selected_products.length !== 1 ? 's' : ''} selected:
            </p>
            <div className="space-y-1">
              {execution.selected_products.slice(0, 3).map((product: any, index: number) => (
                <div key={index} className="flex justify-between text-sm text-muted-foreground">
                  <span className="truncate">{product.name}</span>
                  <span>${product.price?.toFixed(2)}</span>
                </div>
              ))}
              {execution.selected_products.length > 3 && (
                <p className="text-xs text-muted-foreground">
                  +{execution.selected_products.length - 3} more items
                </p>
              )}
            </div>
          </div>
        )}

        {execution.error_message && (
          <Alert className="mb-3">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {execution.error_message}
            </AlertDescription>
          </Alert>
        )}

        {showActions && execution.status === 'pending' && execution.selected_products && (
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={() => handleReviewExecution(execution)}
              className="flex-1"
            >
              <Eye className="h-4 w-4 mr-2" />
              Review & Approve
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Loading auto-gift executions...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Auto-Gift Monitor</h2>
          <p className="text-muted-foreground">
            Track and manage your automated gift executions
          </p>
        </div>
        
        <Button 
          onClick={processPendingExecutions} 
          disabled={processing}
          className="flex items-center gap-2"
        >
          <Zap className="h-4 w-4" />
          {processing ? "Processing..." : "Process Auto-Gifts"}
        </Button>
      </div>

      {/* Urgent Actions Alert */}
      {pendingExecutions.length > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              <strong>{pendingExecutions.length} auto-gift{pendingExecutions.length !== 1 ? 's' : ''}</strong> require your review and approval
            </span>
            <Button size="sm" variant="outline">
              Review Now
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Execution Tabs */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending ({pendingExecutions.length})
          </TabsTrigger>
          <TabsTrigger value="processing" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Processing ({processingExecutions.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Completed ({completedExecutions.length})
          </TabsTrigger>
          <TabsTrigger value="failed" className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Failed ({failedExecutions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingExecutions.length > 0 ? (
            <div className="space-y-4">
              {pendingExecutions.map((execution) => (
                <ExecutionCard key={execution.id} execution={execution} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No pending executions</h3>
                <p className="text-muted-foreground text-sm">
                  Auto-gift executions awaiting approval will appear here
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="processing" className="space-y-4">
          {processingExecutions.length > 0 ? (
            <div className="space-y-4">
              {processingExecutions.map((execution) => (
                <ExecutionCard key={execution.id} execution={execution} showActions={false} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <RefreshCw className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No processing executions</h3>
                <p className="text-muted-foreground text-sm">
                  Approved gifts being processed will appear here
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedExecutions.length > 0 ? (
            <div className="space-y-4">
              {completedExecutions.slice(0, 10).map((execution) => (
                <ExecutionCard key={execution.id} execution={execution} showActions={false} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No completed executions</h3>
                <p className="text-muted-foreground text-sm">
                  Successfully completed auto-gifts will appear here
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="failed" className="space-y-4">
          {failedExecutions.length > 0 ? (
            <div className="space-y-4">
              {failedExecutions.map((execution) => (
                <ExecutionCard key={execution.id} execution={execution} showActions={false} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No failed executions</h3>
                <p className="text-muted-foreground text-sm">
                  Failed auto-gift attempts will appear here
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Gift Approval Modal */}
      {selectedExecution && (
        <GiftApprovalSystem
          open={approvalModalOpen}
          onOpenChange={setApprovalModalOpen}
          execution={selectedExecution}
          onApprove={handleApproveProducts}
          onReject={handleRejectProducts}
        />
      )}
    </div>
  );
};

export default AutoGiftExecutionMonitor;