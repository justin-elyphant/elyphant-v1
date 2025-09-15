
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
        setProcessingStatus('Confirming your payment...');
        
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

        // Use confirm-payment with exponential backoff retry logic
        const retryPaymentConfirmation = async (attempt = 1, maxAttempts = 3) => {
          const delays = [0, 5000, 15000]; // immediate, 5s, 15s
          
          setProcessingStatus(`Confirming payment${attempt > 1 ? ` (attempt ${attempt})` : ''}...`);
          
          try {
            const { data, error } = await supabase.functions.invoke('confirm-payment', {
              body: { session_id: sessionId }
            });

            if (error) throw new Error(error.message);

            if (data?.success && data?.payment_status === 'succeeded') {
              clearCart();
              setOrderNumber(data.order?.order_number || '');
              setProcessingStatus('Order confirmed!');
              toast.success('Payment confirmed! Your order is being processed.');
              return true;
            } else if (data?.payment_status === 'pending' && attempt < maxAttempts) {
              // Payment still processing, retry
              await new Promise(resolve => setTimeout(resolve, delays[attempt]));
              return retryPaymentConfirmation(attempt + 1, maxAttempts);
            } else {
              throw new Error('Payment confirmation failed');
            }
          } catch (retryError) {
            if (attempt < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, delays[attempt]));
              return retryPaymentConfirmation(attempt + 1, maxAttempts);
            }
            throw retryError;
          }
        };

        await retryPaymentConfirmation();
        
      } catch (error) {
        console.error('Payment verification error:', error);
        setProcessingStatus('Payment confirmation in progress');
        toast.error('Payment confirmation is taking longer than expected. Please check your orders page in a few minutes.');
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
