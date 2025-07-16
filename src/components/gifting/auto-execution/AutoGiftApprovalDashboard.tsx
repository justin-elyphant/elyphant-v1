import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gift, Sparkles, Clock, TrendingUp } from "lucide-react";
import { useAutoGiftExecution } from "@/hooks/useAutoGiftExecution";
import { useNotifications } from "@/contexts/notifications/NotificationsContext";
import AutoGiftApprovalCard from "./AutoGiftApprovalCard";
import AutoGiftProductReview from "./AutoGiftProductReview";

const AutoGiftApprovalDashboard = () => {
  const { executions, loading, approveExecution } = useAutoGiftExecution();
  const { addNotification } = useNotifications();
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedExecution, setSelectedExecution] = useState<any>(null);

  const pendingApprovals = executions.filter(exec => 
    exec.status === 'pending' && exec.selected_products?.length > 0
  );

  const recentActivity = executions.filter(exec => 
    exec.status !== 'pending'
  ).slice(0, 3);

  const handleQuickApprove = async (execution: any) => {
    const productIds = execution.selected_products?.map((p: any) => p.product_id) || [];
    await approveExecution(execution.id, productIds);
    
    const recipientName = execution.auto_gifting_rules?.recipient_id ? 'the recipient' : 'someone special';
    addNotification({
      type: "auto_gift_approved",
      title: "Auto-Gift Approved!",
      message: `Your gift for ${recipientName} has been sent and is on its way.`,
      link: "/orders",
      actionText: "Track Order"
    });
  };

  const handleReview = (execution: any) => {
    setSelectedExecution(execution);
    setReviewModalOpen(true);
  };

  const handleReject = async (execution: any) => {
    // TODO: Implement reject functionality
    console.log('Execution rejected:', execution.id);
    addNotification({
      type: "system",
      title: "Auto-Gift Cancelled",
      message: "The auto-gift has been cancelled. You can set up a new one anytime.",
      link: "/auto-gifting"
    });
  };

  const handleApproveFromReview = async (selectedProductIds: string[]) => {
    if (selectedExecution) {
      await approveExecution(selectedExecution.id, selectedProductIds);
      setSelectedExecution(null);
      
      const recipientName = selectedExecution.auto_gifting_rules?.recipient_id ? 'the recipient' : 'someone special';
      addNotification({
        type: "auto_gift_approved",
        title: "Auto-Gift Approved!",
        message: `Your customized gift for ${recipientName} has been sent.`,
        link: "/orders",
        actionText: "Track Order"
      });
    }
  };

  const handleRejectFromReview = async () => {
    if (selectedExecution) {
      await handleReject(selectedExecution);
      setSelectedExecution(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your auto-gifts...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Auto-Gift Approvals
          </h2>
          <p className="text-muted-foreground mt-1">
            AI-powered gift suggestions ready for your approval
          </p>
        </div>
        
        {pendingApprovals.length > 0 && (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            {pendingApprovals.length} pending
          </Badge>
        )}
      </div>

      {/* Pending Approvals */}
      {pendingApprovals.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            Needs Your Approval
          </h3>
          
          <div className="space-y-4">
            {pendingApprovals.map((execution) => (
              <AutoGiftApprovalCard
                key={execution.id}
                executionId={execution.id}
                recipientName={execution.auto_gifting_rules?.recipient_id ? "Friend" : "Someone Special"}
                eventType={execution.user_special_dates?.date_type || "Special Event"}
                executionDate={execution.execution_date.toISOString()}
                selectedProducts={execution.selected_products || []}
                totalAmount={execution.total_amount || 0}
                onQuickApprove={() => handleQuickApprove(execution)}
                onReview={() => handleReview(execution)}
                onReject={() => handleReject(execution)}
              />
            ))}
          </div>
        </div>
      ) : (
        <Card className="border-dashed border-2 border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-primary/10 p-4 rounded-full mb-4">
              <Gift className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-medium mb-2">All caught up!</h3>
            <p className="text-muted-foreground text-sm max-w-md">
              No auto-gifts pending approval right now. When your auto-gifting rules are triggered, 
              you'll see beautiful gift suggestions here.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Your recent auto-gift approvals and deliveries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((execution) => (
                <div key={execution.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <Gift className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        Auto-gift for {execution.auto_gifting_rules?.recipient_id ? "Friend" : "Someone Special"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {execution.status === 'completed' ? 'Delivered' : 'In progress'} • 
                        ${execution.total_amount?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant={execution.status === 'completed' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {execution.status === 'completed' ? 'Delivered' : 'Processing'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Product Review Modal */}
      {selectedExecution && (
        <AutoGiftProductReview
          open={reviewModalOpen}
          onOpenChange={setReviewModalOpen}
          products={selectedExecution.selected_products || []}
          totalBudget={selectedExecution.total_amount || 0}
          eventType={selectedExecution.user_special_dates?.date_type || 'Event'}
          onApprove={handleApproveFromReview}
          onReject={handleRejectFromReview}
        />
      )}
    </div>
  );
};

export default AutoGiftApprovalDashboard;