
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { MapPin, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getOrderPricingBreakdown } from "@/utils/orderPricingUtils";
import { Product } from "@/types/product";
import Header from "@/components/home/Header";

// Import our components
import OrderStatusBadge from "@/components/orders/OrderStatusBadge";
import OrderSummaryCard from "@/components/orders/OrderSummaryCard";
import ShippingInfoCard from "@/components/orders/ShippingInfoCard";
import EnhancedOrderItemsTable from "@/components/orders/EnhancedOrderItemsTable";
import MobileOrderItemsList from "@/components/orders/mobile/MobileOrderItemsList";
import { useIsMobile } from "@/hooks/use-mobile";
import OrderNotesCard from "@/components/orders/OrderNotesCard";
import OrderNotFound from "@/components/orders/OrderNotFound";
import OrderSkeleton from "@/components/orders/OrderSkeleton";
import OrderProgressStepper from "@/components/orders/OrderProgressStepper";
import TrackingInfoCard from "@/components/orders/TrackingInfoCard";
import MobileActionBar from "@/components/orders/MobileActionBar";
import OrderTimeline from "@/components/orders/OrderTimeline";
import { useOrderRealtime } from "@/hooks/useOrderRealtime";
import { formatOrderNumberWithHash } from "@/utils/orderHelpers";
import { format } from "date-fns";
import { OrderBackfillButton } from "@/components/admin/OrderBackfillButton";

const OrderDetail = () => {
  const { orderId } = useParams();
  const { user, isLoading: authLoading } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  

  // Redirect to sign-in if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/signin");
    }
  }, [user, authLoading, navigate]);

  // Load order details from Supabase
  useEffect(() => {
    if (!orderId || !user) return;
    
    const fetchOrder = async () => {
      setIsLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (*)
          `)
          .eq('id', orderId)
          .single();

        if (error) {
          console.error("Error fetching order:", error);
          toast.error("Order not found");
          navigate("/orders");
          return;
        }

        if (data) {
          // Get complete pricing breakdown with backward compatibility
          const pricingBreakdown = getOrderPricingBreakdown(data);
          
          // Smart address resolution for gift orders - use shipping_address jsonb
          let displayShippingInfo = data.shipping_address || {};
          const shopperName = user?.user_metadata?.name || (data.shipping_address as any)?.name || "Customer";
          let recipientName = shopperName;

          // For gift orders, check gift_options for recipient info
          const giftOptions = data.gift_options as any;
          const lineItems = data.line_items as any;
          
          if (giftOptions?.isGift && lineItems?.items?.length > 0) {
            const firstItem = lineItems.items[0];
            if (firstItem?.shippingAddress) {
              const recipientAddress = firstItem.shippingAddress;
              displayShippingInfo = {
                name: recipientAddress.name || `${recipientAddress.first_name || ''} ${recipientAddress.last_name || ''}`.trim(),
                address_line1: recipientAddress.address_line1 || recipientAddress.address,
                address_line2: recipientAddress.address_line2 || recipientAddress.addressLine2,
                city: recipientAddress.city,
                state: recipientAddress.state,
                zip_code: recipientAddress.zip_code || recipientAddress.zipCode,
                country: recipientAddress.country || 'US'
              };
              recipientName = recipientAddress.name || 
                `${recipientAddress.first_name || ''} ${recipientAddress.last_name || ''}`.trim();
            }
          }
          
          // Transform the data to match the expected format with complete pricing breakdown
          const transformedOrder = {
            id: data.id,
            date: data.created_at,
            created_at: data.created_at,
            status: data.status,
            scheduled_delivery_date: data.scheduled_delivery_date,
            total: data.total_amount,
            subtotal: pricingBreakdown.subtotal,
            shipping_cost: pricingBreakdown.shipping_cost,
            tax_amount: pricingBreakdown.tax_amount,
            gifting_fee: pricingBreakdown.gifting_fee,
            gifting_fee_name: pricingBreakdown.gifting_fee_name,
            gifting_fee_description: pricingBreakdown.gifting_fee_description,
            items: data.order_items || [],
            shipping_info: displayShippingInfo,
            customerName: shopperName,
            recipientName: recipientName,
            tracking_number: data.tracking_number || null,
            zinc_order_id: data.zinc_order_id || null
          };
          setOrder(transformedOrder);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        toast.error("Failed to load order details");
        navigate("/orders");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, navigate, user]);

  // Smart delivery date extraction helper
  const getDeliveryDateText = (order: any): string | null => {
    // Priority 1: If delivered, find actual delivery timestamp from timeline
    if (order.status === 'delivered' && order.zinc_timeline_events) {
      const deliveredEvent = order.zinc_timeline_events.find(
        (e: any) => e.type === 'shipment.delivered'
      );
      if (deliveredEvent) {
        return format(new Date(deliveredEvent.timestamp), "MMM d, yyyy");
      }
    }
    
    // Priority 2: Use merchant tracking data estimated delivery
    if (order.merchant_tracking_data?.delivery_dates?.[0]) {
      const deliveryDate = order.merchant_tracking_data.delivery_dates[0];
      return deliveryDate.delivery_date || format(new Date(deliveryDate.date), "MMM d, yyyy");
    }
    
    // Priority 3: Use scheduled delivery date from order
    if (order.scheduled_delivery_date) {
      return format(new Date(order.scheduled_delivery_date), "MMM d, yyyy");
    }
    
    return null;
  };

  const handleReorder = async (item?: any) => {
    if (!item) {
      toast.error("Unable to reorder", {
        description: "Product information is incomplete."
      });
      return;
    }

    try {
      // Convert order item to Product type
      const product: Product = {
        product_id: item.product_id || item.id,
        title: item.name || item.product_name || "Product",
        price: item.unit_price || item.price || 0,
        image: item.image_url || item.image || "/placeholder.svg",
        name: item.name || item.product_name,
        id: item.product_id || item.id,
        retailer: item.retailer || "amazon",
        brand: item.brand,
        category: item.category,
      };

      await addToCart(product, item.quantity || 1);
      
      toast.success("Item added to cart", {
        description: "Ready to checkout",
        action: {
          label: "View Cart",
          onClick: () => navigate("/cart")
        }
      });
    } catch (error) {
      console.error("Error adding item to cart:", error);
      toast.error("Failed to add item to cart", {
        description: "Please try again or contact support."
      });
    }
  };


  const handleTrackPackage = () => {
    // Scroll to tracking card or open external tracking
    const trackingCard = document.getElementById('tracking-card');
    if (trackingCard) {
      trackingCard.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="container max-w-6xl mx-auto py-8 px-4 flex justify-center">
        <OrderSkeleton />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to signin
  }

  if (!order) {
    return (
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <OrderNotFound />
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="container max-w-6xl mx-auto py-8 px-4 pb-20 lg:pb-8 overflow-x-hidden mt-[120px]">
        <div className="mb-6">
          <Button variant="outline" onClick={() => navigate("/orders")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
        </div>

      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold">Order {formatOrderNumberWithHash(order.id)}</h1>
          <p className="text-muted-foreground">
            Placed on {new Date(order.date).toLocaleDateString()} • 
            <OrderStatusBadge 
              status={order.status}
              orderId={order.id}
              stripePaymentIntentId={order.stripe_payment_intent_id}
              stripeSessionId={order.stripe_session_id}
              createdAt={order.created_at}
              onStatusUpdate={(newStatus) => {
                // Refresh order data when status updates
                window.location.reload();
              }}
            />
          </p>
        </div>
        {/* Message Vendor functionality removed per user request */}
        <div className="hidden md:flex gap-2">
          <OrderBackfillButton orderId={order.id} />
          {order.status === "shipped" && (
            <Button onClick={handleTrackPackage}>
              <MapPin className="h-4 w-4 mr-2" />
              Track Package
            </Button>
          )}
        </div>
      </div>

      {/* Order Progress Stepper */}
      <OrderProgressStepper 
        status={order.status} 
        trackingNumber={order.tracking_number}
        estimatedDelivery={getDeliveryDateText(order)}
        zincTimelineEvents={order.zinc_timeline_events}
      />

      {/* Order Summary and Details Grid */}
      <div className="grid gap-6 lg:grid-cols-3 mb-6 min-w-0">
        <div className="lg:col-span-2 space-y-6 min-w-0">
          <OrderSummaryCard order={order} />
          
          {/* Order Items - Responsive */}
          {isMobile ? (
            <MobileOrderItemsList 
              order={order} 
              onReorder={handleReorder}
            />
          ) : (
            <EnhancedOrderItemsTable 
              order={order} 
              onReorder={handleReorder}
            />
          )}
        </div>
        
        <div className="space-y-6 min-w-0">
          <ShippingInfoCard order={order} />
          
          {/* Tracking Information */}
          {order.tracking_number && (
            <div id="tracking-card">
              <TrackingInfoCard order={order} />
            </div>
          )}
          
          {/* Order Timeline */}
          <OrderTimeline 
            orderStatus={order.status}
            orderDate={order.date}
            zincTimelineEvents={order.zinc_timeline_events}
            merchantTrackingData={order.merchant_tracking_data}
          />
        </div>
      </div>
      


      {/* Mobile Action Bar */}
      <MobileActionBar 
        order={order}
        onTrack={handleTrackPackage}
        onReorder={() => handleReorder()}
      />
      </div>
    </>
  );
};

export default OrderDetail;
