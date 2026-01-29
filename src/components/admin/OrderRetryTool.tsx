
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, RefreshCw, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { retryOrderWithBillingInfo } from "@/services/orderRetryService";

const isPaymentConfirmed = (
  paymentStatus: string | null | undefined,
  paymentIntentId?: string | null
) => {
  // Legacy PaymentIntent-style value
  if (paymentStatus === 'succeeded') return true;

  // Stripe Checkout Session uses payment_status: 'paid' | 'unpaid'
  if (paymentStatus === 'paid') return !!paymentIntentId;

  return false;
};

const OrderRetryTool = () => {
  const [orderId, setOrderId] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryResult, setRetryResult] = useState<any>(null);
  const [orderInfo, setOrderInfo] = useState<any>(null);
  const [isCheckingOrder, setIsCheckingOrder] = useState(false);
  const { toast } = useToast();

  const checkOrderPaymentStatus = async () => {
    if (!orderId.trim()) {
      toast.error("Please enter an order ID");
      return;
    }

    setIsCheckingOrder(true);
    setOrderInfo(null);
    setRetryResult(null);

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, status, payment_status, total_amount, payment_intent_id, created_at')
        .eq('id', orderId)
        .single();

      if (error || !data) {
        toast.error("Order not found");
        return;
      }

      setOrderInfo(data);
      
      if (!isPaymentConfirmed(data.payment_status, data.payment_intent_id)) {
        toast.error("⚠️ Payment not confirmed - retry blocked to prevent duplicate charges", {
          description: `payment_status = ${data.payment_status || 'null'}`
        });
      } else {
        toast.success("✅ Payment verified - safe to retry");
      }
    } catch (error) {
      console.error('Error checking order:', error);
      toast.error("Failed to check order status");
    } finally {
      setIsCheckingOrder(false);
    }
  };

  const handleRetryOrder = async () => {
    if (!orderId.trim()) {
      toast.error("Please enter an order ID");
      return;
    }

    if (!cardholderName.trim()) {
      toast.error("Please enter the cardholder name");
      return;
    }

    if (!orderInfo) {
      toast.error("Please check order status first");
      return;
    }

    if (!isPaymentConfirmed(orderInfo.payment_status, orderInfo.payment_intent_id)) {
      toast.error("Cannot retry - payment not confirmed. This prevents duplicate charges.");
      return;
    }

    setIsRetrying(true);
    setRetryResult(null);

    try {
      console.log(`🔄 Starting retry for order ${orderId} with cardholder: ${cardholderName}`);
      
      const billingInfo = {
        cardholderName: cardholderName.trim(),
        // The service will use the shipping address from the order for billing
      };

      const result = await retryOrderWithBillingInfo(orderId, billingInfo, false);
      
      setRetryResult(result);
      
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.error || result.message);
      }
    } catch (error) {
      console.error('Error retrying order:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      setRetryResult({
        success: false,
        message: 'Order retry failed',
        error: errorMessage
      });
      
      toast.error(errorMessage);
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Retry Failed Order
          </CardTitle>
          <CardDescription>
            Enter the order ID and cardholder name to retry a failed Zinc order with proper billing information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="orderId">Order ID</Label>
                <Input
                  id="orderId"
                  placeholder="e.g., c5526964e99a6214ad309b2bd4dbc184"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  disabled={isRetrying || isCheckingOrder}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cardholderName">Cardholder Name</Label>
                <Input
                  id="cardholderName"
                  placeholder="e.g., Justin Meeks"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  disabled={isRetrying}
                />
              </div>
            </div>

            <Button 
              onClick={checkOrderPaymentStatus} 
              disabled={isCheckingOrder || !orderId.trim()}
              variant="outline"
              className="w-full"
            >
              {isCheckingOrder ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Checking Order Status...
                </>
              ) : (
                <>
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Check Order & Payment Status
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
                      isPaymentConfirmed(orderInfo.payment_status, orderInfo.payment_intent_id)
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {orderInfo.payment_status}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Amount:</span> ${orderInfo.total_amount}
                  </div>
                  <div>
                    <span className="font-medium">Method:</span> {orderInfo.order_method}
                  </div>
                  <div>
                    <span className="font-medium">Created:</span> {new Date(orderInfo.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <Button 
            onClick={handleRetryOrder} 
            disabled={
              isRetrying ||
              !orderId.trim() ||
              !cardholderName.trim() ||
              !orderInfo ||
              !isPaymentConfirmed(orderInfo.payment_status, orderInfo.payment_intent_id)
            }
            className="w-full"
          >
            {isRetrying ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Retrying Order...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry Order
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {retryResult && (
        <Alert className={retryResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          {retryResult.success ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={retryResult.success ? "text-green-700" : "text-red-700"}>
            <div className="space-y-2">
              <p className="font-medium">
                {retryResult.success ? 'Order Retry Successful' : 'Order Retry Failed'}
              </p>
              <p>{retryResult.message}</p>
              {retryResult.zincOrderId && (
                <p className="text-sm">
                  <strong>Zinc Order ID:</strong> {retryResult.zincOrderId}
                </p>
              )}
              {retryResult.error && (
                <p className="text-sm">
                  <strong>Error:</strong> {retryResult.error}
                </p>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

          <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <p className="font-medium mb-2">Duplicate Charge Prevention:</p>
          <ul className="text-sm space-y-1 list-disc list-inside">
            <li><strong>Payment verification:</strong> Only orders with confirmed payment can be retried</li>
            <li><strong>No double charging:</strong> System verifies payment status before any processing</li>
            <li><strong>Safe retry:</strong> Retry only resubmits order fulfillment, never payment</li>
            <li><strong>Order tracking:</strong> All retry attempts are logged with payment verification</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default OrderRetryTool;
