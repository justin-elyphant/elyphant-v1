import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, AlertTriangle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const ForceProcessOrder = () => {
  const [orderId, setOrderId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processResult, setProcessResult] = useState<any>(null);
  const [orderInfo, setOrderInfo] = useState<any>(null);
  const [isCheckingOrder, setIsCheckingOrder] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { toast } = useToast();

  const checkOrderStatus = async () => {
    if (!orderId.trim()) {
      toast.error("Please enter an order ID");
      return;
    }

    setIsCheckingOrder(true);
    setOrderInfo(null);
    setProcessResult(null);

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, status, payment_status, total_amount, created_at')
        .eq('id', orderId)
        .single();

      if (error || !data) {
        toast.error("Order not found");
        return;
      }

      setOrderInfo(data);
      
      if (data.payment_status !== 'paid') {
        toast.warning("⚠️ Payment not confirmed for this order");
      }
    } catch (error) {
      console.error('Error checking order:', error);
      toast.error("Failed to check order status");
    } finally {
      setIsCheckingOrder(false);
    }
  };

  const handleForceProcess = async () => {
    setShowConfirmDialog(false);
    setIsProcessing(true);
    setProcessResult(null);

    try {
      console.log(`🚨 Force processing order ${orderId}`);
      
      const { data, error } = await supabase.functions.invoke('force-process-order', {
        body: { orderId }
      });

      if (error) throw error;

      setProcessResult(data);
      
      if (data.success) {
        toast.success(data.message);
        // Refresh order info
        checkOrderStatus();
      } else {
        toast.error(data.error || data.message);
      }
    } catch (error) {
      console.error('Error force processing order:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      setProcessResult({
        success: false,
        message: 'Force process failed',
        error: errorMessage
      });
      
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Force Process Order (VIP Override)
          </CardTitle>
          <CardDescription>
            Bypass funding checks to process VIP or urgent orders immediately. Requires admin permissions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Admin Only:</strong> This bypasses all funding checks and will process the order even if ZMA balance is insufficient. Use only for VIP or urgent orders.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forceOrderId">Order ID</Label>
              <Input
                id="forceOrderId"
                placeholder="Enter order ID to force process"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                disabled={isProcessing || isCheckingOrder}
              />
            </div>

            <Button 
              onClick={checkOrderStatus} 
              disabled={isCheckingOrder || !orderId.trim()}
              variant="outline"
              className="w-full"
            >
              {isCheckingOrder ? (
                <>
                  <AlertCircle className="mr-2 h-4 w-4 animate-spin" />
                  Checking Order Status...
                </>
              ) : (
                <>
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Check Order Status
                </>
              )}
            </Button>

            {orderInfo && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Order:</span> {orderInfo.order_number}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span> {orderInfo.status}
                  </div>
                  <div>
                    <span className="font-medium">Payment:</span> 
                    <span className={`ml-1 px-2 py-1 rounded text-xs ${
                      orderInfo.payment_status === 'succeeded' 
                        ? 'bg-success/10 text-success' 
                        : 'bg-destructive/10 text-destructive'
                    }`}>
                      {orderInfo.payment_status}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Funding:</span> 
                    <span className={`ml-1 px-2 py-1 rounded text-xs ${
                      orderInfo.funding_status === 'funded' 
                        ? 'bg-success/10 text-success' 
                        : 'bg-warning/10 text-warning'
                    }`}>
                      {orderInfo.funding_status || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Amount:</span> ${orderInfo.total_amount}
                  </div>
                  <div>
                    <span className="font-medium">Created:</span> {new Date(orderInfo.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
            <DialogTrigger asChild>
              <Button 
                disabled={isProcessing || !orderId.trim() || !orderInfo}
                variant="destructive"
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <AlertTriangle className="mr-2 h-4 w-4 animate-spin" />
                    Force Processing...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Force Process Order
                  </>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Force Process</DialogTitle>
                <DialogDescription>
                  Are you sure you want to bypass funding checks and force process this order?
                </DialogDescription>
              </DialogHeader>
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This will process the order immediately, even if ZMA balance is insufficient. This action will be logged in the audit trail.
                </AlertDescription>
              </Alert>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleForceProcess}>
                  Confirm Force Process
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {processResult && (
        <Alert className={processResult.success ? "border-success bg-success/10" : "border-destructive bg-destructive/10"}>
          {processResult.success ? (
            <CheckCircle className="h-4 w-4 text-success" />
          ) : (
            <AlertCircle className="h-4 w-4 text-destructive" />
          )}
          <AlertDescription className={processResult.success ? "text-success" : "text-destructive"}>
            <div className="space-y-2">
              <p className="font-medium">
                {processResult.success ? 'Order Force Processed Successfully' : 'Force Process Failed'}
              </p>
              <p>{processResult.message}</p>
              {processResult.zincOrderId && (
                <p className="text-sm">
                  <strong>Zinc Order ID:</strong> {processResult.zincOrderId}
                </p>
              )}
              {processResult.error && (
                <p className="text-sm">
                  <strong>Error:</strong> {processResult.error}
                </p>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <p className="font-medium mb-2">Security & Audit:</p>
          <ul className="text-sm space-y-1 list-disc list-inside">
            <li><strong>Permission check:</strong> Requires can_manage_payment_methods permission</li>
            <li><strong>Audit logging:</strong> All force process actions are logged in admin_audit_log</li>
            <li><strong>Payment verified:</strong> Order must have successful payment before processing</li>
            <li><strong>ZMA alert:</strong> If balance goes negative, admins will be alerted</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default ForceProcessOrder;
