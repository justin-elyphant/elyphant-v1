import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Package, Truck, Clock, AlertCircle, Gift, Sparkles, RefreshCw, Calendar, Lock } from "lucide-react";
import GuestSignupCard from "@/components/checkout/GuestSignupCard";
import { formatPrice } from "@/lib/utils";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import UnifiedGiftSchedulingModal, { ProductHints } from "@/components/gifting/unified/UnifiedGiftSchedulingModal";
import { useCart } from "@/contexts/CartContext";
import { getOrderLineItems, getOrderLineItemsPricing } from "@/lib/utils/orderUtils";
import { getOrderPricingBreakdown } from "@/utils/orderPricingUtils";
import { detectHolidayFromDate } from "@/constants/holidayDates";

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  created_at: string;
  is_split_order: boolean | null;
  parent_order_id: string | null;
  delivery_group_id: string | null;
  split_order_index: number | null;
  total_split_orders: number | null;
  cart_data?: any;
  line_items?: any[];
  shipping_address?: any;
  scheduled_delivery_date?: string;
  recipient_id?: string;
  recipient_name?: string;
}

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const guestEmail = searchParams.get('guest_email') || '';
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [childOrders, setChildOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [pollingCount, setPollingCount] = useState(0);
  const [pollingStartTime] = useState<number>(Date.now());
  const [showProgressiveError, setShowProgressiveError] = useState(false);
  const [showAutoGiftUpsell, setShowAutoGiftUpsell] = useState(false);
  const [autoGiftInitialData, setAutoGiftInitialData] = useState<any>(null);
  const [showWelcomeBack, setShowWelcomeBack] = useState(true);
  const [hasCartBeenCleared, setHasCartBeenCleared] = useState(false);

  useEffect(() => {
    if (!orderId && !sessionId) {
      navigate('/orders');
      return;
    }

    // Hide welcome message after 3 seconds
    const welcomeTimer = setTimeout(() => setShowWelcomeBack(false), 3000);

    fetchOrderDetails();
    
    // Poll for status updates every 3 seconds for up to 30 seconds
    const interval = setInterval(() => {
      setPollingCount(prev => prev + 1);
      fetchOrderDetails();
    }, 3000);
    
    // Show progressive error after 15 seconds if order still not loaded
    const progressiveTimeout = setTimeout(() => {
      setShowProgressiveError(true);
    }, 15000);

    // Auto-trigger reconciliation after 18 seconds if no order found
    const autoReconcileTimeout = setTimeout(() => {
      if (!order && sessionId) {
        console.log('🔄 Auto-triggering reconciliation after 18s...');
        handleReconcile();
      }
    }, 18000);
    
    // Stop polling after 30 seconds
    const stopPollingTimeout = setTimeout(() => clearInterval(interval), 30000);
    
    return () => {
      clearInterval(interval);
      clearTimeout(progressiveTimeout);
      clearTimeout(autoReconcileTimeout);
      clearTimeout(stopPollingTimeout);
      clearTimeout(welcomeTimer);
    };
  }, [orderId, sessionId, order]);

  const checkForAutoGiftUpsell = async (orderData: Order) => {
    try {
      // Check if order contains wishlist items
      const isFromWishlist = orderData.cart_data?.source === 'wishlist' || 
                            orderData.cart_data?.wishlist_id ||
                            orderData.cart_data?.wishlist_owner_id;

      // NEW: Check for holiday-scheduled orders
      const scheduledDate = orderData.scheduled_delivery_date || orderData.cart_data?.scheduled_delivery_date;
      const detectedHoliday = scheduledDate 
        ? detectHolidayFromDate(new Date(scheduledDate)) 
        : null;

      // Show upsell if: wishlist OR holiday-scheduled
      if (!isFromWishlist && !detectedHoliday) return;

      // Get recipient info from order or cart data
      const recipientId = orderData.recipient_id || 
                         orderData.cart_data?.wishlist_owner_id ||
                         orderData.cart_data?.recipient_id;
      const recipientName = orderData.recipient_name || 
                           orderData.cart_data?.wishlist_owner_name || 
                           orderData.cart_data?.recipient_name ||
                           'them';
      const totalAmount = orderData.total_amount;

      if (!recipientId) return;

      // Check for existing recurring rule for this recipient + occasion
      const eventType = detectedHoliday?.key || 'other';
      const { data: existingRule } = await (supabase as any)
        .from('auto_gifting_rules')
        .select('id')
        .eq('recipient_id', recipientId)
        .eq('date_type', eventType)
        .eq('is_active', true)
        .maybeSingle();

      if (existingRule) return; // Already has recurring rule

      // Try to infer event type from profile's important_dates (for wishlist orders)
      let eventDate = scheduledDate || null;

      if (!detectedHoliday && isFromWishlist) {
        const { data: profile } = await (supabase as any)
          .from('profiles')
          .select('important_dates')
          .eq('id', recipientId)
          .single();

        if (profile && profile.important_dates) {
          const dates = Array.isArray(profile.important_dates) ? profile.important_dates : [];
          const today = new Date();
          
          // Find next upcoming date
          const upcomingDate = dates
            .map((date: any) => {
              const dateStr = date.date;
              const [month, day] = dateStr.split('-').map(Number);
              const parsedDate = new Date(today.getFullYear(), month - 1, day);
              if (parsedDate < today) {
                parsedDate.setFullYear(parsedDate.getFullYear() + 1);
              }
              return { ...date, parsedDate };
            })
            .filter((date: any) => date.parsedDate >= today)
            .sort((a: any, b: any) => a.parsedDate.getTime() - b.parsedDate.getTime())[0];

          if (upcomingDate) {
            eventDate = upcomingDate.parsedDate.toISOString();
          }
        }
      }

      // Build product hints from order items for AI suggestions
      const orderItems = getOrderLineItems(orderData);
      const productHints: ProductHints | undefined = orderItems.length > 0 ? {
        productId: orderItems[0].product_id || orderItems[0].id || '',
        title: orderItems[0].name || orderItems[0].title || '',
        brand: orderItems[0].brand,
        category: orderItems[0].category,
        priceRange: [
          Math.floor(totalAmount * 0.8),
          Math.ceil(totalAmount * 1.2)
        ] as [number, number],
        image: orderItems[0].image_url || orderItems[0].image || ''
      } : undefined;

      // Prepare initial data for auto-gift setup
      setAutoGiftInitialData({
        recipientId,
        recipientName,
        eventType: detectedHoliday?.key || 'other',
        eventDate,
        budgetLimit: Math.ceil(totalAmount),
        productHints,
        // Enhanced copy data for holiday detection
        isHolidayScheduled: !!detectedHoliday,
        holidayLabel: detectedHoliday?.label,
        selectedProducts: orderItems.map((item: any) => ({
          productId: item.product_id || item.id,
          name: item.name,
          price: item.price,
          image: item.image_url
        }))
      });

    } catch (error) {
      console.error('Error checking for auto-gift upsell:', error);
    }
  };

  const fetchOrderDetails = async () => {
    try {
      let orderData = null;

      // PRIMARY: Check for checkout_session_id (Stripe Checkout Sessions)
      if (sessionId) {
        const sessionResult = await (supabase as any)
          .from('orders')
          .select('*')
          .eq('checkout_session_id', sessionId)
          .maybeSingle();
        
        if (sessionResult.data) {
          orderData = sessionResult.data;
        }
      }
      
      // Fallback: Try to find order by ID (UUID)
      if (!orderData && orderId) {
        const result = await (supabase as any)
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .maybeSingle();
        orderData = result.data;
      }

      // Legacy: Try to find by payment_intent_id
      if (!orderData && orderId) {
        const paymentIntentResult = await (supabase as any)
          .from('orders')
          .select('*')
          .eq('payment_intent_id', orderId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (paymentIntentResult.data) {
          orderData = paymentIntentResult.data;
        }
      }

      if (orderData) {
        setOrder(orderData);
        
        // Handle split orders (if applicable)
        if (orderData.is_split_order && !orderData.parent_order_id) {
          const childResult = await (supabase as any)
            .from('orders')
            .select('*')
            .eq('parent_order_id', orderData.id)
            .order('split_order_index');
          if (childResult.data) setChildOrders(childResult.data);
        }
        
        // Check if order is from a wishlist for auto-gift upsell
        checkForAutoGiftUpsell(orderData);
        
        // Clear cart after successful order confirmation (only once)
        if (!hasCartBeenCleared && (sessionId || orderId)) {
          console.log('🛒 Clearing cart after successful order confirmation');
          clearCart();
          setHasCartBeenCleared(true);
        }
      }
      
      // FIX: Always set loading to false after query completes (prevents stuck loading state)
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching order:', err);
      setLoading(false);
    }
  };

  const handleReconcile = async () => {
    if (!sessionId) return;
    
    setLoading(true);
    try {
      console.log('🔄 Invoking reconcile-checkout-session for:', sessionId);
      const { data, error } = await supabase.functions.invoke('reconcile-checkout-session', {
        body: { sessionId }
      });
      
      if (error) throw error;
      
      if (data?.success && data.order_id) {
        console.log('✅ Order reconciled:', data.order_id);
        // Refresh to show the order
        window.location.reload();
      }
    } catch (err: any) {
      console.error('❌ Reconciliation failed:', err);
      alert(`Failed to create order: ${err.message || 'Unknown error'}. Please contact support.`);
    } finally {
      setLoading(false);
    }
  };


  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'processing':
      case 'shipped':
        return <Truck className="w-5 h-5 text-blue-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'failed':
      case 'cancelled':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Package className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string, isScheduledGift: boolean = false) => {
    // Special handling for pending_payment (scheduled gifts)
    if (status === 'pending_payment' && isScheduledGift) {
      return (
        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-700">
          <Calendar className="w-3 h-3 mr-1" />
          SCHEDULED DELIVERY
        </Badge>
      );
    }
    
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: "default",
      delivered: "default",
      processing: "secondary",
      shipped: "secondary",
      pending: "outline",
      pending_payment: "outline",
      scheduled: "outline",
      failed: "destructive",
      cancelled: "destructive"
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  // Progressive loading state
  if (loading || (!order && pollingCount < 4)) {
    const timeElapsed = Math.floor((Date.now() - pollingStartTime) / 1000);
    
    return (
      <SidebarLayout>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <CheckCircle className="w-10 h-10 text-primary animate-pulse" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
            <p className="text-muted-foreground">
              {timeElapsed < 10 
                ? "Creating your order..." 
                : "Still processing... This may take a moment"}
            </p>
          </div>
          <Card className="p-6 space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-32 w-full" />
          </Card>
        </div>
      </SidebarLayout>
    );
  }

  // Progressive error state with reconciliation option
  if (!order && showProgressiveError) {
    const timeElapsed = Math.floor((Date.now() - pollingStartTime) / 1000);

    
    return (
      <SidebarLayout>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card className="p-8 text-center">
            <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">
              {timeElapsed < 25 ? "Still Processing Your Order" : "Taking Longer Than Usual"}
            </h2>
            <p className="text-muted-foreground mb-2">
              Your payment was successful! We're just finishing up your order.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              This sometimes takes up to a minute. Your order will appear shortly.
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => window.location.reload()} variant="default">
                Refresh Page
              </Button>
              {sessionId && (
                <Button onClick={handleReconcile} variant="secondary">
                  Retry Order Creation
                </Button>
              )}
              <Button onClick={() => navigate('/orders')} variant="outline">
                View All Orders
              </Button>
            </div>
          </Card>
        </div>
      </SidebarLayout>
    );
  }

  // Handle null order case
  if (!order) {
    return (
      <SidebarLayout>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Order Not Found</AlertTitle>
            <AlertDescription>
              Unable to load order details. Please check your orders page.
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button onClick={() => navigate('/orders')}>View All Orders</Button>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  const isMultiRecipient = order.is_split_order && !order.parent_order_id;

  // Check if this order is from a wishlist purchase
  const isFromWishlist = order?.cart_data?.source === 'wishlist' || 
                        order?.cart_data?.wishlist_id ||
                        order?.cart_data?.wishlist_owner_id;
  const wishlistOwnerName = order?.cart_data?.wishlist_owner_name || 'the recipient';

  // Detect scheduled gifts (orders with future delivery date)
  const isScheduledGift = !!(
    order?.scheduled_delivery_date && 
    new Date(order.scheduled_delivery_date) > new Date()
  );

  // Detect ANY gift order (scheduled or Buy Now) for privacy masking
  // Also detect by name mismatch: if shipping name differs from buyer, it's a gift
  const buyerName = (user?.user_metadata?.name || user?.user_metadata?.full_name || '').trim().toLowerCase();
  const shippingName = (order?.shipping_address?.name || '').trim().toLowerCase();
  const isNameMismatch = buyerName && shippingName && buyerName !== shippingName;
  
  const isGiftOrder = isScheduledGift || 
    !!(order as any)?.gift_options?.is_gift || 
    !!(order as any)?.gift_options?.isGift ||
    !!(order as any)?.recipient_id ||
    isNameMismatch;

  // Extract recipient info from line_items for scheduled gifts
  const orderLineItems = getOrderLineItems(order);
  const firstItem = orderLineItems[0] || {};
  const scheduledRecipientName = firstItem.recipient_name || order?.recipient_name;
  const scheduledRecipientShipping = firstItem.recipient_shipping;
  const scheduledGiftMessage = firstItem.gift_message || order?.cart_data?.giftOptions?.giftMessage;

  return (
    <SidebarLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Welcome Back & Success Message */}
        {showWelcomeBack && (
          <Alert className="mb-6 border-green-500/50 bg-green-50 dark:bg-green-950/20">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertTitle className="text-green-900 dark:text-green-100">Welcome back! Payment Successful ✓</AlertTitle>
            <AlertDescription className="text-green-800 dark:text-green-200">
              Your order is being processed. This usually takes 3-5 seconds.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Wishlist Gift Sent Hero - Coral-Orange Theme */}
        {isFromWishlist && (
          <div className="mb-6 p-6 bg-gradient-to-r from-[#EF4444] via-[#F97316] to-[#FB923C] rounded-2xl text-white text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4 backdrop-blur-sm">
              <Gift className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">
              🎉 Gift Sent to {wishlistOwnerName}!
            </h2>
            <p className="text-white/90 mb-4">
              Your thoughtful gift is on its way. They'll receive tracking updates directly.
            </p>
            <div className="flex flex-wrap gap-3 justify-center text-sm">
              <span className="bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-sm">
                ✨ Gift wrapped with care
              </span>
              <span className="bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-sm">
                📦 Ships to their address
              </span>
            </div>
          </div>
        )}

        {/* Scheduled Gift Hero Card - Purple Theme */}
        {isScheduledGift && scheduledRecipientName && !isFromWishlist && (
          <div className="mb-6 p-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl text-white text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4 backdrop-blur-sm">
              <Gift className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">
              🎁 Gift Scheduled for {scheduledRecipientName}!
            </h2>
            <p className="text-white/90 mb-2">
              Arrives on or before {format(new Date(order.scheduled_delivery_date!), 'MMMM d, yyyy')}
            </p>
            {scheduledGiftMessage && (
              <p className="text-sm italic text-white/80 mb-3">"{scheduledGiftMessage}"</p>
            )}
            <div className="mt-4 text-sm bg-white/20 rounded-lg p-3 backdrop-blur-sm">
              💳 Your card has been saved. Payment will process 7 days before delivery.
            </div>
          </div>
        )}

        {/* Success Header - Only show for non-wishlist, non-scheduled orders */}
        {!isFromWishlist && !isScheduledGift && (
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full mb-4">
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
            <p className="text-muted-foreground">
              Your order has been received and is being processed
            </p>
          </div>
        )}

        {/* Order Number */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Order Number</p>
              <p className="text-2xl font-bold">{order.order_number}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Status</p>
              {getStatusBadge(order.status, isScheduledGift)}
            </div>
          </div>
          
          {isMultiRecipient && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Package className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-900 dark:text-blue-100">Multiple Recipients</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Your order has been split into {childOrders.length} separate shipments for different recipients
                  </p>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Child Orders (Multi-Recipient) */}
        {isMultiRecipient && childOrders.length > 0 && (
          <div className="space-y-4 mb-6">
            <h2 className="text-xl font-semibold">Shipments</h2>
            {childOrders.map((child, index) => {
              const childRecipient = child.cart_data?.recipient?.name || `Recipient ${index + 1}`;
              
              return (
                <Card key={child.id} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(child.status)}
                      <div>
                        <p className="font-semibold">
                          To: {childRecipient}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Order #{child.order_number}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(child.status)}
                  </div>

                  <div className="space-y-2">
                  {getOrderLineItems(child).map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-3 py-2 border-t">
                      {item.image_url && (
                        <img 
                          src={item.image_url} 
                          alt={item.title || item.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-sm line-clamp-2">{item.title || item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Qty: {item.quantity} × {formatPrice(item.unit_price || item.price || 0)}
                        </p>
                      </div>
                      <p className="font-semibold">
                        {formatPrice(item.quantity * (item.unit_price || item.price || 0))}
                      </p>
                    </div>
                  ))}
                  </div>

                  {child.cart_data?.giftOptions?.giftMessage && (
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Gift Message:</p>
                      <p className="text-sm italic">"{child.cart_data.giftOptions.giftMessage}"</p>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t flex justify-between items-center">
                    <span className="font-semibold">Subtotal:</span>
                    <span className="text-lg font-bold">{formatPrice(child.total_amount)}</span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Single Order Items */}
        {!isMultiRecipient && (
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Order Items</h2>
            <div className="space-y-4">
              {getOrderLineItems(order).map((item: any, idx: number) => (
                <div key={idx} className="flex items-center gap-4 pb-4 border-b last:border-0">
                  {item.image_url && (
                    <img 
                      src={item.image_url} 
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold line-clamp-2">{item.title || item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Quantity: {item.quantity}
                    </p>
                    {item.gift_message && (
                      <p className="text-sm italic text-muted-foreground mt-1">
                        "{item.gift_message}"
                      </p>
                    )}
                  </div>
                    <div className="text-right">
                    <p className="font-semibold">{formatPrice(item.quantity * (item.unit_price || item.price || 0))}</p>
                    <p className="text-sm text-muted-foreground">{formatPrice(item.unit_price || item.price || 0)} each</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Order Total */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
          <div className="space-y-2">
            {(() => {
              // Use the pricing breakdown utility which handles both formats
              const pricing = getOrderPricingBreakdown(order);

              return (
                <>
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatPrice(pricing.subtotal)}</span>
                  </div>
                  {pricing.shipping_cost > 0 && (
                    <div className="flex justify-between">
                      <span>Shipping:</span>
                      <span>{formatPrice(pricing.shipping_cost)}</span>
                    </div>
                  )}
                  {pricing.tax_amount > 0 && (
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>{formatPrice(pricing.tax_amount)}</span>
                    </div>
                  )}
                  {pricing.gifting_fee > 0 && (
                    <div className="flex justify-between">
                      <span>{pricing.gifting_fee_name}:</span>
                      <span>{formatPrice(pricing.gifting_fee)}</span>
                    </div>
                  )}
                </>
              );
            })()}
            <div className="flex justify-between text-xl font-bold pt-2 border-t">
              <span>Total:</span>
              <span>{formatPrice(order.total_amount)}</span>
            </div>
          </div>
        </Card>

        {/* Shipping/Delivery Address - Single Recipient Only */}
        {/* For scheduled gifts, show recipient address from line_items; otherwise show sender's shipping */}
        {!isMultiRecipient && (isGiftOrder ? (scheduledRecipientShipping || order.shipping_address) : order.shipping_address) && (
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {isGiftOrder ? 'Delivery Address' : 'Shipping Address'}
            </h2>
            {isGiftOrder ? (
              <div className="text-sm">
                <p className="font-medium">
                  {scheduledRecipientShipping?.name || scheduledRecipientName || order.shipping_address?.name || 'Recipient'}
                </p>
                {/* Privacy: Only show city/state for gift recipients */}
                <p>
                  {(scheduledRecipientShipping?.city || order.shipping_address?.city)}, {(scheduledRecipientShipping?.state || order.shipping_address?.state)}
                </p>
                <p>{(scheduledRecipientShipping?.country || order.shipping_address?.country) || 'United States'}</p>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  Full address securely stored for delivery
                </p>
              </div>
            ) : (
              <div className="text-sm">
                <p className="font-medium">{order.shipping_address?.name || 'Customer'}</p>
                <p>{order.shipping_address?.address_line1}</p>
                {order.shipping_address?.address_line2 && <p>{order.shipping_address.address_line2}</p>}
                <p>
                  {order.shipping_address?.city}, {order.shipping_address?.state} {order.shipping_address?.postal_code}
                </p>
                <p>{order.shipping_address?.country || 'United States'}</p>
              </div>
            )}
          </Card>
        )}

        {/* Auto-Gift Upsell Banner - Enhanced for holiday detection */}
        {autoGiftInitialData && !showAutoGiftUpsell && (
          <Card className="p-6 mb-6 bg-gradient-to-r from-purple-50 to-sky-50 dark:from-purple-950/20 dark:to-sky-950/20 border-purple-200 dark:border-purple-800">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-sky-500 flex items-center justify-center">
                  <RefreshCw className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">
                  {autoGiftInitialData.isHolidayScheduled 
                    ? `Make this a recurring ${autoGiftInitialData.holidayLabel} gift?`
                    : `Want to automate gifts for ${autoGiftInitialData.recipientName}?`
                  }
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {autoGiftInitialData.isHolidayScheduled 
                    ? `You just gifted for ${autoGiftInitialData.holidayLabel}! Set up recurring and we'll remind you next year with similar gift suggestions.`
                    : `Never miss ${autoGiftInitialData.recipientName}'s special occasions! Set up recurring gifts and we'll handle everything - from product selection to delivery.`
                  }
                </p>
                <div className="flex gap-3 flex-wrap">
                  <Button
                    onClick={() => setShowAutoGiftUpsell(true)}
                    className="bg-gradient-to-r from-purple-600 to-sky-500 hover:from-purple-700 hover:to-sky-600"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Set Up Recurring Gift
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setAutoGiftInitialData(null)}
                  >
                    Maybe Later
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Guest-to-User Conversion Card */}
        {!user && guestEmail && (
          <div className="mb-6">
            <GuestSignupCard
              email={guestEmail}
              heading="Want to track this order and future gifts?"
              subheading="Create your free Elyphant account to manage orders, build wishlists, and discover personalized gift ideas."
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <Button onClick={() => navigate('/orders')} variant="default" className="flex-1">
            View All Orders
          </Button>
          <Button onClick={() => navigate('/marketplace')} variant="outline" className="flex-1">
            Continue Shopping
          </Button>
        </div>
      </div>

      {/* Recurring Gift Setup Dialog */}
      <UnifiedGiftSchedulingModal
        open={showAutoGiftUpsell}
        onOpenChange={setShowAutoGiftUpsell}
        standaloneMode={true}
        editingRule={autoGiftInitialData}
        productHints={autoGiftInitialData?.productHints}
      />
    </SidebarLayout>
  );
};

export default OrderConfirmation;
