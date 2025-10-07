
import React, { useEffect, useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const PurchaseSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [purchaseDetails, setPurchaseDetails] = useState<any>(null);
  
  // Get parameters from URL
  const productId = searchParams.get('product');
  const sessionId = searchParams.get('session_id');
  const orderId = searchParams.get('order_id');
  
  useEffect(() => {
    // Show success toast
    toast.success("Purchase Successful!", {
      description: "Your order has been confirmed and will be processed shortly."
    });
    
    const fetchPurchaseDetails = async () => {
      try {
        // Poll Orders table directly - single source of truth
        if (sessionId) {
          const { data: order, error } = await supabase
            .from('orders')
            .select('*')
            .eq('stripe_session_id', sessionId)
            .maybeSingle();
          
          if (!error && order) {
            setPurchaseDetails(order);
          }
        } 
        // If this is coming from a direct order ID
        else if (orderId) {
          const { data: order, error } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .maybeSingle();
            
          if (!error && order) {
            setPurchaseDetails(order);
          }
        }
      } catch (err) {
        console.error('Error fetching purchase details:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPurchaseDetails();
    
    // Save completed purchase to history
    const savePurchaseToHistory = () => {
      const purchaseHistory = JSON.parse(localStorage.getItem('purchaseHistory') || '[]');
      
      const newPurchase = {
        id: orderId || sessionId || `purchase-${Date.now()}`,
        date: new Date().toISOString(),
        productId: productId,
        status: 'completed',
        source: sessionId ? 'stripe' : 'zinc',
      };
      
      purchaseHistory.push(newPurchase);
      localStorage.setItem('purchaseHistory', JSON.stringify(purchaseHistory));
    };
    
    savePurchaseToHistory();
  }, [sessionId, orderId, productId]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-16 px-4">
        <Card className="max-w-lg mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Processing your purchase...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-16 px-4">
      <Card className="max-w-lg mx-auto">
        <CardHeader className="text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
          <CardTitle className="text-2xl font-bold">Purchase Successful!</CardTitle>
          <CardDescription className="text-lg">
            Thank you for your purchase
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">
            Your order has been confirmed and will be
            processed shortly.
          </p>
          
          <div className="border-t border-b py-4 my-4 border-gray-100">
            <p className="font-medium">Order Details</p>
            <p className="text-sm text-muted-foreground">
              A confirmation email with your order details has been sent to your email address.
            </p>
            
            {purchaseDetails && (
              <div className="mt-2 text-sm">
                <p><span className="font-medium">Order ID:</span> {purchaseDetails.id}</p>
                {purchaseDetails.total && (
                  <p><span className="font-medium">Amount:</span> ${purchaseDetails.total.toFixed(2)}</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild>
            <Link to="/orders">View Orders</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/marketplace">Continue Shopping</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PurchaseSuccess;
