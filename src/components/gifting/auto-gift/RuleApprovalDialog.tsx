import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Gift, Check, X, Loader2, AlertCircle } from "lucide-react";
import { getOccasionDisplayName } from "@/utils/autoGiftDisplayHelpers";

interface RuleApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ruleId: string | null;
  initialAction: 'approve' | 'reject';
}

interface ExecutionData {
  id: string;
  execution_date: string;
  selected_products: any[];
  status: string;
  rule: {
    id: string;
    date_type: string;
    budget_limit: number;
    recipient?: {
      name?: string;
      email?: string;
    };
  };
}

const RuleApprovalDialog: React.FC<RuleApprovalDialogProps> = ({
  open,
  onOpenChange,
  ruleId,
  initialAction,
}) => {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [executionData, setExecutionData] = useState<ExecutionData | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(initialAction === 'reject');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && ruleId) {
      loadExecutionData();
      setShowRejectForm(initialAction === 'reject');
    }
  }, [open, ruleId, initialAction]);

  const loadExecutionData = async () => {
    if (!ruleId) return;

    try {
      setLoading(true);
      setError(null);

      // Find the pending execution for this rule
      const { data: execution, error: execError } = await supabase
        .from('automated_gift_executions')
        .select(`
          *,
          auto_gifting_rules!automated_gift_executions_rule_id_fkey (
            id,
            date_type,
            budget_limit,
            recipient:profiles!auto_gifting_rules_recipient_id_fkey (
              name,
              email
            )
          )
        `)
        .eq('rule_id', ruleId)
        .eq('status', 'pending_approval')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (execError) {
        console.error('Error loading execution:', execError);
        setError('Failed to load approval data');
        return;
      }

      if (!execution) {
        // Check if there's a rule without an execution yet
        const { data: rule, error: ruleError } = await supabase
          .from('auto_gifting_rules')
          .select(`
            id,
            date_type,
            budget_limit,
            scheduled_date,
            recipient:profiles!auto_gifting_rules_recipient_id_fkey (
              name,
              email
            )
          `)
          .eq('id', ruleId)
          .single();

        if (ruleError || !rule) {
          setError('No pending approval found for this rule');
          return;
        }

        // Show rule info even without execution
        setExecutionData({
          id: '',
          execution_date: rule.scheduled_date || '',
          selected_products: [],
          status: 'no_execution',
          rule: {
            id: rule.id,
            date_type: rule.date_type,
            budget_limit: rule.budget_limit || 50,
            recipient: rule.recipient,
          },
        });
        return;
      }

      const products = Array.isArray(execution.selected_products) ? execution.selected_products : [];

      setExecutionData({
        id: execution.id,
        execution_date: execution.execution_date,
        selected_products: products,
        status: execution.status,
        rule: {
          id: execution.auto_gifting_rules?.id || ruleId,
          date_type: execution.auto_gifting_rules?.date_type || 'gift',
          budget_limit: execution.auto_gifting_rules?.budget_limit || 50,
          recipient: execution.auto_gifting_rules?.recipient,
        },
      });

      // Pre-select all products
      setSelectedProducts(products.map((p: any) => p.product_id));

    } catch (error) {
      console.error('Error loading execution data:', error);
      setError('Failed to load approval data');
    } finally {
      setLoading(false);
    }
  };

  const toggleProduct = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleApprove = async () => {
    if (!executionData?.id) {
      toast.error("No execution to approve");
      return;
    }

    if (selectedProducts.length === 0) {
      toast.error("Please select at least one product");
      return;
    }

    try {
      setProcessing(true);

      const { data, error } = await supabase.functions.invoke('approve-auto-gift', {
        body: {
          executionId: executionData.id,
          action: 'approve',
          selectedProductIds: selectedProducts,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      // Check if off-session payment was used (no redirect needed)
      if (data?.paymentMethod === 'off_session') {
        const formattedDate = data.scheduledDate 
          ? new Date(data.scheduledDate).toLocaleDateString('en-US', { 
              month: 'long', day: 'numeric', year: 'numeric' 
            })
          : 'soon';
        
        toast.success(`Approved! Your gift will be sent ${formattedDate}`);
        onOpenChange(false);
        return;
      }

      // Fallback: Redirect to Stripe Checkout
      if (data?.checkoutUrl) {
        toast.success("Redirecting to complete payment...");
        window.location.href = data.checkoutUrl;
        return;
      }

      // If we get here, assume success (legacy behavior)
      toast.success("Auto-gift approved! Order is being processed.");
      onOpenChange(false);

    } catch (error: any) {
      console.error('Error approving:', error);
      toast.error(error.message || "Failed to approve auto-gift");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!executionData?.id) {
      toast.error("No execution to reject");
      return;
    }

    try {
      setProcessing(true);

      const { data, error } = await supabase.functions.invoke('approve-auto-gift', {
        body: {
          executionId: executionData.id,
          action: 'reject',
          rejectionReason: rejectionReason || 'User rejected the selection',
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      toast.success("Auto-gift rejected");
      onOpenChange(false);

    } catch (error: any) {
      console.error('Error rejecting:', error);
      toast.error(error.message || "Failed to reject auto-gift");
    } finally {
      setProcessing(false);
    }
  };

  const recipientName = executionData?.rule?.recipient?.name || 
                        executionData?.rule?.recipient?.email || 
                        'Recipient';
  const occasionName = getOccasionDisplayName(executionData?.rule?.date_type || 'gift');
  const totalAmount = executionData?.selected_products
    .filter(p => selectedProducts.includes(p.product_id))
    .reduce((sum, p) => sum + (p.price || 0), 0) || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Gift className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Auto-Gift Approval</DialogTitle>
              <DialogDescription>
                Review your gift for {recipientName}'s {occasionName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{error}</p>
            <Button variant="outline" className="mt-4" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        ) : executionData?.status === 'no_execution' ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No pending approval found for this gift. 
              The system may still be preparing gift suggestions.
            </p>
            <Button variant="outline" className="mt-4" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Products List */}
            {executionData?.selected_products && executionData.selected_products.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">Suggested Gifts:</p>
                {executionData.selected_products.map((product: any) => (
                  <Card 
                    key={product.product_id} 
                    className={`cursor-pointer transition-colors ${
                      selectedProducts.includes(product.product_id) 
                        ? 'border-primary bg-primary/5' 
                        : ''
                    }`}
                    onClick={() => toggleProduct(product.product_id)}
                  >
                    <CardContent className="p-3 flex items-center gap-3">
                      <Checkbox
                        checked={selectedProducts.includes(product.product_id)}
                        onCheckedChange={() => toggleProduct(product.product_id)}
                      />
                      {product.image_url && (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {product.name || product.title}
                        </p>
                      </div>
                      <Badge variant="secondary">${product.price}</Badge>
                    </CardContent>
                  </Card>
                ))}

                <div className="flex justify-between items-center pt-2">
                  <span className="text-sm font-medium">Total:</span>
                  <Badge variant="outline" className="text-base">
                    ${totalAmount.toFixed(2)}
                  </Badge>
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No gift suggestions available yet.
              </p>
            )}

            {/* Action Buttons */}
            {!showRejectForm ? (
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleApprove}
                  disabled={processing || selectedProducts.length === 0}
                  className="flex-1"
                >
                  {processing ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Approve & Order
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowRejectForm(true)}
                  disabled={processing}
                >
                  <X className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </div>
            ) : (
              <div className="space-y-3 pt-4">
                <Textarea
                  placeholder="Optional: Reason for rejection"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="min-h-[80px]"
                />
                <div className="flex gap-3">
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={processing}
                    className="flex-1"
                  >
                    {processing ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <X className="h-4 w-4 mr-2" />
                    )}
                    Confirm Reject
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowRejectForm(false)}
                    disabled={processing}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RuleApprovalDialog;
