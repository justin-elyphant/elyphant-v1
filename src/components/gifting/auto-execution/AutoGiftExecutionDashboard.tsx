
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift, AlertCircle, Eye } from "lucide-react";
import { useAutoGiftExecution } from "@/hooks/useAutoGiftExecution";
import AutoGiftProductReview from "./AutoGiftProductReview";
import AutoGiftExecutionCard from "./AutoGiftExecutionCard";

const AutoGiftExecutionDashboard = () => {
  const { executions, loading, processing, processPendingExecutions, approveExecution } = useAutoGiftExecution();
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedExecution, setSelectedExecution] = useState<any>(null);


  const pendingExecutions = executions.filter(exec => exec.status === 'pending' && exec.selected_products?.length > 0);
  const recentExecutions = executions.slice(0, 5);

  const handleReviewProducts = (execution: any) => {
    setSelectedExecution(execution);
    setReviewModalOpen(true);
  };

  const handleApproveProducts = async (selectedProductIds: string[]) => {
    if (selectedExecution) {
      await approveExecution(selectedExecution.id, selectedProductIds);
      setSelectedExecution(null);
    }
  };

  const handleRejectProducts = async () => {
    // TODO: Implement reject functionality
    console.log('Products rejected');
    setSelectedExecution(null);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading auto-gift executions...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with action button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Auto-Gift Executions</h2>
          <p className="text-muted-foreground">
            Monitor and manage your automated gift selections
          </p>
        </div>
        
        <Button 
          onClick={processPendingExecutions} 
          disabled={processing}
          className="flex items-center gap-2"
        >
          <Gift className="h-4 w-4" />
          {processing ? "Processing..." : "Process Auto-Gifts"}
        </Button>
      </div>

      {/* Pending executions requiring attention */}
      {pendingExecutions.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="h-5 w-5" />
              Pending Auto-Gifts Require Your Review
            </CardTitle>
            <CardDescription className="text-yellow-700">
              {pendingExecutions.length} auto-gift execution(s) have selected products waiting for your approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingExecutions.map((execution) => (
                <div key={execution.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Gift className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="font-medium">Auto-gift for upcoming event</p>
                      <p className="text-sm text-muted-foreground">
                        {execution.selected_products?.length || 0} products selected • 
                        Budget: ${execution.total_amount?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => handleReviewProducts(execution)}
                    className="flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Review & Approve
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent executions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Auto-Gift Activity</CardTitle>
          <CardDescription>
            Your latest automated gift executions and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentExecutions.length > 0 ? (
            <div className="space-y-4">
              {recentExecutions.map((execution) => (
                <AutoGiftExecutionCard 
                  key={execution.id}
                  execution={execution}
                  onReviewProducts={handleReviewProducts}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No auto-gift executions yet</h3>
              <p className="text-muted-foreground text-sm">
                Auto-gift executions will appear here when your rules are triggered
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Review Modal */}
      {selectedExecution && (
        <AutoGiftProductReview
          open={reviewModalOpen}
          onOpenChange={setReviewModalOpen}
          products={selectedExecution.selected_products || []}
          totalBudget={selectedExecution.total_amount || 0}
          eventType={selectedExecution.event_type || 'Event'}
          onApprove={handleApproveProducts}
          onReject={handleRejectProducts}
        />
      )}
    </div>
  );
};

export default AutoGiftExecutionDashboard;
