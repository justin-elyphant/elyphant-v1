/**
 * Order Retry Tool - Admin utility for retrying failed orders with billing info
 * 
 * This component demonstrates the complete billing info capture and retry functionality.
 * It can be used to fix the stuck order and test your wife's use case.
 */

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, RefreshCw, CreditCard } from "lucide-react";
import { retryOrderWithBillingInfo, getOrdersNeedingRetry } from "@/services/orderRetryService";
import { createBillingInfo } from "@/services/billingService";

interface Order {
  id: string;
  order_number: string;
  status: string;
  zinc_status: string;
  created_at: string;
  billing_info: any;
  shipping_info: any;
  total_amount: number;
}

const OrderRetryTool = () => {
  const [failedOrders, setFailedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [cardholderName, setCardholderName] = useState<string>('');
  const [billingAddress, setBillingAddress] = useState({
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US'
  });
  const [retryResult, setRetryResult] = useState<string>('');
  const [isRetrying, setIsRetrying] = useState(false);

  const loadFailedOrders = async () => {
    setLoading(true);
    try {
      const orders = await getOrdersNeedingRetry();
      setFailedOrders(orders);
    } catch (error) {
      console.error('Error loading failed orders:', error);
      setRetryResult(`Error loading orders: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderSelect = (order: Order) => {
    setSelectedOrderId(order.id);
    
    // Pre-fill with existing billing info or shipping info as fallback
    if (order.billing_info?.cardholderName) {
      setCardholderName(order.billing_info.cardholderName);
    } else if (order.shipping_info?.name) {
      setCardholderName(order.shipping_info.name);
    }

    // Pre-fill billing address with shipping address as fallback
    const shippingInfo = order.shipping_info;
    if (shippingInfo) {
      setBillingAddress({
        address: shippingInfo.address || shippingInfo.address_line1 || '',
        city: shippingInfo.city || '',
        state: shippingInfo.state || '',
        zipCode: shippingInfo.zipCode || shippingInfo.zip_code || '',
        country: 'US'
      });
    }
  };

  const handleRetry = async () => {
    if (!selectedOrderId || !cardholderName.trim()) {
      setRetryResult('Please select an order and enter cardholder name');
      return;
    }

    setIsRetrying(true);
    setRetryResult('');

    try {
      // Create billing info for the retry
      const billingInfo = createBillingInfo(cardholderName, billingAddress);
      
      // Retry the order
      const result = await retryOrderWithBillingInfo(selectedOrderId, billingInfo, true); // Use test mode
      
      if (result.success) {
        setRetryResult(`✅ SUCCESS! Order retried successfully. Zinc Order ID: ${result.zincOrderId}`);
        // Refresh the failed orders list
        await loadFailedOrders();
      } else {
        setRetryResult(`❌ FAILED: ${result.message} - ${result.error}`);
      }
    } catch (error) {
      setRetryResult(`❌ ERROR: ${error.message}`);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleWifeUseCase = () => {
    // Pre-fill for your wife's use case
    setCardholderName('Mrs. Meeks'); // Your wife's name
    setBillingAddress({
      address: '309 Solana Hills Drive',
      city: 'Solana Beach',
      state: 'CA',
      zipCode: '92075',
      country: 'US'
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Order Retry Tool - Billing Info Fix
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Step 1: Load Failed Orders */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Step 1: Load Failed Orders</Label>
            <div className="flex gap-2">
              <Button onClick={loadFailedOrders} disabled={loading} size="sm">
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Load Failed Orders'}
              </Button>
              <Button variant="outline" onClick={handleWifeUseCase} size="sm">
                Setup Wife's Use Case
              </Button>
            </div>
            
            {failedOrders.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Found {failedOrders.length} failed orders:
                </Label>
                {failedOrders.map((order) => (
                  <div
                    key={order.id}
                    onClick={() => handleOrderSelect(order)}
                    className={`p-3 border rounded cursor-pointer transition-colors ${
                      selectedOrderId === order.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{order.order_number}</div>
                        <div className="text-sm text-muted-foreground">
                          ${order.total_amount} • {new Date(order.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Badge variant="destructive" className="text-xs">{order.status}</Badge>
                        {order.billing_info ? (
                          <Badge variant="secondary" className="text-xs">Has Billing</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">No Billing</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Step 2: Enter Billing Information */}
          {selectedOrderId && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Step 2: Enter Billing Information</Label>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cardholderName">Cardholder Name *</Label>
                  <Input
                    id="cardholderName"
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value)}
                    placeholder="Mrs. Meeks"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Billing Address</Label>
                  <Input
                    id="address"
                    value={billingAddress.address}
                    onChange={(e) => setBillingAddress(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="309 Solana Hills Drive"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={billingAddress.city}
                    onChange={(e) => setBillingAddress(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Solana Beach"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={billingAddress.state}
                    onChange={(e) => setBillingAddress(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="CA"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="zipCode">ZIP Code</Label>
                  <Input
                    id="zipCode"
                    value={billingAddress.zipCode}
                    onChange={(e) => setBillingAddress(prev => ({ ...prev, zipCode: e.target.value }))}
                    placeholder="92075"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Retry Order */}
          {selectedOrderId && cardholderName && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Step 3: Retry Order</Label>
              <Button 
                onClick={handleRetry} 
                disabled={isRetrying}
                className="w-full"
              >
                {isRetrying ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Retry Order with Billing Info (Test Mode)
              </Button>
            </div>
          )}

          {/* Results */}
          {retryResult && (
            <Alert className={retryResult.startsWith('✅') ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <pre className="whitespace-pre-wrap text-sm">{retryResult}</pre>
              </AlertDescription>
            </Alert>
          )}
          
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderRetryTool;