
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";
import Header from "@/components/home/Header";
import Footer from "@/components/home/Footer";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(true);
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [processingStatus, setProcessingStatus] = useState<string>('Verifying payment...');

  useEffect(() => {
    const processPaymentSuccess = async () => {
      const sessionId = searchParams.get('session_id');
      
      if (!sessionId) {
        toast.error('Invalid payment session');
        navigate('/marketplace');
        return;
      }

      try {
        setProcessingStatus('Verifying payment...');
        
        // First check if we already processed this session
        const { data: existingOrder } = await supabase
          .from('orders')
          .select('id, order_number, status, payment_status, zinc_order_id')
          .eq('stripe_session_id', sessionId)
          .single();

        if (existingOrder?.payment_status === 'succeeded') {
          // Order already processed successfully
          clearCart();
          setOrderNumber(existingOrder.order_number || '');
          setProcessingStatus('Order confirmed!');
          toast.success('Payment successful! Your order has been confirmed.');
          setIsProcessing(false);
          return;
        }

        setProcessingStatus('Processing payment with Stripe...');
        
        // Verify payment with Stripe and update order
        const { data, error } = await supabase.functions.invoke('verify-checkout-session', {
          body: { session_id: sessionId }
        });

        if (error) {
          throw new Error(error.message);
        }

        if (data?.success) {
          clearCart();
          setOrderNumber(data.order_number || '');
          setProcessingStatus('Order confirmed!');
          toast.success('Payment successful! Your order has been confirmed and is being processed.');
        } else {
          throw new Error('Payment verification failed');
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        setProcessingStatus('Error processing payment');
        toast.error('There was an issue verifying your payment. Please contact support.');
      } finally {
        setIsProcessing(false);
      }
    };

    processPaymentSuccess();
  }, [searchParams, navigate, clearCart]);

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto" />
            <h2 className="text-xl font-semibold">{processingStatus}</h2>
            <p className="text-muted-foreground">Please wait while we confirm your order and process it with our fulfillment partner.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h1 className="text-2xl font-bold text-green-600">Payment Successful!</h1>
            <p className="text-muted-foreground">
              Thank you for your purchase. Your order has been confirmed and will be processed shortly.
            </p>
            {orderNumber && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm font-medium text-green-800">
                  Order Number: {orderNumber}
                </p>
              </div>
            )}
          </div>
          
          <div className="space-y-3">
            <Button 
              onClick={() => navigate('/orders')} 
              className="w-full"
            >
              View My Orders
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/marketplace')} 
              className="w-full"
            >
              Continue Shopping
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PaymentSuccess;
