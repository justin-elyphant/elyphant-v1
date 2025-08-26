import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAutoGiftExecution } from "@/hooks/useAutoGiftExecution";
import { Gift, Clock, CheckCircle2, XCircle, AlertCircle, RefreshCw, Mail } from "lucide-react";
import { toast } from "sonner";

const statusConfig = {
  pending: { icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50", label: "Pending", variant: "secondary" as const },
  processing: { icon: RefreshCw, color: "text-blue-600", bg: "bg-blue-50", label: "Processing", variant: "default" as const },
  completed: { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50", label: "Completed", variant: "default" as const },
  failed: { icon: XCircle, color: "text-red-600", bg: "bg-red-50", label: "Failed", variant: "destructive" as const },
  cancelled: { icon: XCircle, color: "text-gray-600", bg: "bg-gray-50", label: "Cancelled", variant: "secondary" as const },
  pending_approval: { icon: Mail, color: "text-orange-600", bg: "bg-orange-50", label: "Needs Approval", variant: "secondary" as const }
};

export default function AutoGiftExecutionDashboard() {
  const { 
    executions, 
    loading, 
    processing, 
    loadExecutions, 
    processPendingExecutions,
    sendEmailApproval,
    getApprovalTokens
  } = useAutoGiftExecution();

  const handleProcessNow = async () => {
    await processPendingExecutions();
  };

  const handleSendApproval = async (execution: any) => {
    try {
      // Get recipient details from the execution data
      const recipientEmail = "user@example.com"; // TODO: Get from recipient profile
      const recipientName = execution.recipient_name || "Recipient";
      
      const giftDetails = {
        occasion: execution.occasion || "Special Occasion",
        budget: execution.total_amount || 50,
        selectedProducts: execution.selected_products || []
      };

      await sendEmailApproval(execution.id, recipientEmail, recipientName, giftDetails);
    } catch (error) {
      console.error("Failed to send approval email:", error);
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Auto-Gift Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const pendingExecutions = executions.filter(e => e.status === 'pending');
  const recentExecutions = executions.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{executions.length}</div>
              <div className="text-sm text-muted-foreground">Total Executions</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {executions.filter(e => e.status === 'completed').length}
              </div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {pendingExecutions.length}
              </div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(executions.reduce((sum, e) => sum + (e.total_amount || 0), 0))}
              </div>
              <div className="text-sm text-muted-foreground">Total Spent</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      {pendingExecutions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              Pending Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {pendingExecutions.length} execution{pendingExecutions.length !== 1 ? 's' : ''} ready for processing
                </p>
                <p className="text-sm text-muted-foreground">
                  Run auto-gift processor to generate recommendations and send approvals
                </p>
              </div>
              <Button 
                onClick={handleProcessNow}
                disabled={processing}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${processing ? 'animate-spin' : ''}`} />
                {processing ? 'Processing...' : 'Process Now'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Executions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Recent Auto-Gift Executions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentExecutions.length === 0 ? (
            <div className="text-center py-8">
              <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No Auto-Gift Executions</h3>
              <p className="text-sm text-muted-foreground">
                Auto-gift executions will appear here when they are triggered by your rules.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentExecutions.map((execution) => {
                const config = statusConfig[execution.status as keyof typeof statusConfig] || statusConfig.pending;
                const StatusIcon = config.icon;
                
                return (
                  <div key={execution.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`p-2 rounded-full ${config.bg}`}>
                        <StatusIcon className={`h-4 w-4 ${config.color}`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm">
                            Execution #{execution.id.slice(0, 8)}
                          </p>
                          <Badge variant={config.variant}>
                            {config.label}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Date: {formatDate(execution.execution_date)}</span>
                          {execution.total_amount && (
                            <span>Amount: {formatCurrency(execution.total_amount)}</span>
                          )}
                          {execution.selected_products && (
                            <span>Products: {execution.selected_products.length}</span>
                          )}
                        </div>
                        
                        {execution.error_message && (
                          <p className="text-sm text-red-600 mt-1">
                            Error: {execution.error_message}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {execution.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSendApproval(execution)}
                          className="flex items-center gap-1"
                        >
                          <Mail className="h-3 w-3" />
                          Send Approval
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          navigator.clipboard.writeText(execution.id);
                          toast.success("Execution ID copied to clipboard");
                        }}
                      >
                        Copy ID
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}