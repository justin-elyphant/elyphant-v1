
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, RefreshCw, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { retryOrderWithBillingInfo } from "@/services/orderRetryService";

const OrderRetryTool = () => {
  const [orderId, setOrderId] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryResult, setRetryResult] = useState<any>(null);
  const { toast } = useToast();

  const handleRetryOrder = async () => {
    if (!orderId.trim()) {
      toast({
        title: "Error",
        description: "Please enter an order ID",
        variant: "destructive"
      });
      return;
    }

    if (!cardholderName.trim()) {
      toast({
        title: "Error", 
        description: "Please enter the cardholder name",
        variant: "destructive"
      });
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
        toast({
          title: "Success",
          description: result.message,
        });
      } else {
        toast({
          title: "Retry Failed",
          description: result.error || result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error retrying order:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      setRetryResult({
        success: false,
        message: 'Order retry failed',
        error: errorMessage
      });
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="orderId">Order ID</Label>
              <Input
                id="orderId"
                placeholder="e.g., c5526964e99a6214ad309b2bd4dbc184"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                disabled={isRetrying}
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
            onClick={handleRetryOrder} 
            disabled={isRetrying || !orderId.trim() || !cardholderName.trim()}
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
          <p className="font-medium mb-2">How this works:</p>
          <ul className="text-sm space-y-1 list-disc list-inside">
            <li>The tool updates the order with the cardholder name you provide</li>
            <li>It uses the existing shipping address as the billing address</li>
            <li>The order is resubmitted to Zinc with proper billing information</li>
            <li>You can track the retry result and any new Zinc order ID generated</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default OrderRetryTool;
