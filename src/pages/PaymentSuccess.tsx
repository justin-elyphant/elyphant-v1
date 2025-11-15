
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
  const [processingStatus, setProcessingStatus] = useState<string>('Confirming your payment...');
  const [startTime] = useState<number>(Date.now());

  useEffect(() => {
    const processPaymentSuccess = async () => {
      const sessionId = searchParams.get('session_id');
      let messageInterval: NodeJS.Timeout | null = null;
      
      if (!sessionId) {
        toast.error('Invalid payment session');
        navigate('/marketplace');
        return;
      }

      try {
        // Time-aware messaging progression
        const updateProgressiveMessage = () => {
          const elapsed = Date.now() - startTime;
          if (elapsed < 30000) {
            setProcessingStatus('Confirming your payment...');
          } else if (elapsed < 120000) {
            setProcessingStatus('Processing your order...');
          } else {
            setProcessingStatus('Payment verification taking longer than usual - this is normal for security');
          }
        };

        updateProgressiveMessage();
        messageInterval = setInterval(updateProgressiveMessage, 10000);
        
        // First check if we already processed this session
        const { data: existingOrder } = await supabase
          .from('orders')
          .select('id, order_number, status, payment_status, zinc_order_id')
          .eq('checkout_session_id', sessionId)
          .single();

        if (existingOrder?.payment_status === 'succeeded') {
          // Order already processed successfully
          clearCart();
          setOrderNumber(existingOrder.order_number || '');
          setProcessingStatus('Order confirmed!');
          toast.success('Payment successful! Your order has been confirmed.');
          if (messageInterval) {
            clearInterval(messageInterval);
            messageInterval = null;
          }
          setIsProcessing(false);
          return;
        }

        // Poll Orders table with exponential backoff
        const pollOrderStatus = async (attempt = 1, maxAttempts = 6) => {
          const delays = [2000, 3000, 5000, 8000, 10000, 15000]; // Progressive delays
          
          if (attempt > 1) {
            const elapsed = Date.now() - startTime;
            if (elapsed < 120000) {
              setProcessingStatus(`Checking order status (${attempt}/${maxAttempts})...`);
            } else {
              setProcessingStatus(`Payment verification in progress - this is normal for security`);
            }
          }
          
          try {
            // Poll the Orders table - webhook updates this
            const { data: order, error } = await supabase
              .from('orders')
              .select('id, order_number, status, payment_status, total_amount')
              .eq('checkout_session_id', sessionId)
              .maybeSingle();

            if (error) throw new Error(error.message);

            if (order?.payment_status === 'succeeded') {
              clearCart();
              setOrderNumber(order.order_number || '');
              setProcessingStatus('Order confirmed!');
              toast.success('Payment confirmed! Your order is being processed.');
              return true;
            } else if (attempt < maxAttempts) {
              // Order still processing, retry after delay
              await new Promise(resolve => setTimeout(resolve, delays[attempt - 1]));
              return pollOrderStatus(attempt + 1, maxAttempts);
            } else {
              // Max attempts reached - order should be in system by now
              setProcessingStatus('Order created - processing may take a few minutes');
              toast.success('Your order has been received and is being processed.');
              return true;
            }
          } catch (retryError) {
            if (attempt < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, delays[attempt - 1]));
              return pollOrderStatus(attempt + 1, maxAttempts);
            }
            throw retryError;
          }
        };

        await pollOrderStatus();
        
      } catch (error) {
        console.error('Payment verification error:', error);
        const elapsed = Date.now() - startTime;
        if (elapsed > 120000) {
          setProcessingStatus('Payment verification taking longer than usual - this is normal for security');
        } else {
          setProcessingStatus('Payment confirmation in progress');
        }
        toast.error('Payment confirmation is taking longer than expected. Please check your orders page in a few minutes.');
      } finally {
        if (messageInterval) {
          clearInterval(messageInterval);
          messageInterval = null;
        }
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
            {Date.now() - startTime < 120000 ? (
              <p className="text-muted-foreground">Please wait while we confirm your order and process it with our fulfillment partner.</p>
            ) : (
              <div className="space-y-2 text-muted-foreground">
                <p>Payment verification can take a few minutes for security reasons.</p>
                <p className="text-sm">You can safely close this page - we'll email you confirmation once complete.</p>
              </div>
            )}
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
