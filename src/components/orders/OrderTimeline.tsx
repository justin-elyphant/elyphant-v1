import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Clock, Truck, Home, X, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { computeOrderSteps, ZincTimelineEvent } from "@/utils/orderTrackingUtils";

interface OrderTimelineProps {
  orderStatus: string;
  orderDate: string;
  estimatedDelivery?: string | null;
  fulfilledAt?: string | null;
  trackingEvents?: Array<{
    date: string;
    location: string;
    description: string;
  }>;
  zincTimelineEvents?: ZincTimelineEvent[];
  merchantTrackingData?: {
    merchant_order_ids?: Array<{
      merchant: string;
      merchant_order_id: string;
      tracking_url?: string;
      shipping_address?: string;
    }>;
    delivery_dates?: Array<{
      date: string;
      delivery_date: string;
    }>;
  };
}

const stepIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  ordered: Package,
  processing: Clock,
  shipped: Truck,
  delivered: Home,
};

const stepDescriptions: Record<string, string> = {
  ordered: "Your order has been received and confirmed",
  processing: "We're preparing your items for shipment",
  shipped: "Your package is on its way",
  delivered: "Package delivered successfully",
};

const OrderTimeline = ({
  orderStatus,
  orderDate,
  trackingEvents,
  zincTimelineEvents = [],
  merchantTrackingData,
}: OrderTimelineProps) => {
  const steps = computeOrderSteps(orderStatus, zincTimelineEvents, orderDate);

  // Estimate timestamps for steps missing them
  const baseTime = new Date(orderDate).getTime();
  const estimatedOffsets: Record<string, number> = {
    ordered: 0,
    processing: 2 * 60 * 60 * 1000,
    shipped: 24 * 60 * 60 * 1000,
    delivered: 3 * 24 * 60 * 60 * 1000,
  };

  // Build timeline events from shared steps
  const events = steps.map((step) => {
    const timestamp = step.timestamp
      ? new Date(step.timestamp)
      : new Date(baseTime + (estimatedOffsets[step.id] || 0));
    const Icon = stepIcons[step.id] || Package;
    const trackingUrl =
      step.id === "shipped"
        ? merchantTrackingData?.merchant_order_ids?.[0]?.tracking_url
        : undefined;

    return {
      ...step,
      timestamp,
      icon: Icon,
      description: stepDescriptions[step.id] || step.label,
      trackingUrl,
      displayStatus: step.status === "upcoming" ? ("inactive" as const) : step.status,
    };
  });

  // Add cancelled/failed as a terminal event if applicable
  if (
    (orderStatus === "cancelled" || orderStatus === "failed") &&
    !["shipped", "delivered", "processing"].includes(orderStatus)
  ) {
    events.push({
      id: "cancelled",
      label: orderStatus === "cancelled" ? "Order Cancelled" : "Order Failed",
      status: "active",
      timestamp: new Date(),
      icon: X,
      description:
        orderStatus === "cancelled" ? "Order was cancelled" : "Order processing failed",
      trackingUrl: undefined,
      displayStatus: "completed" as const,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="order-timeline space-y-6">
          {events.map((event) => {
            const Icon = event.icon;
            return (
              <div key={event.id} className="timeline-item">
                <div className={`timeline-marker ${event.displayStatus}`}>
                  <Icon className="h-3 w-3 text-white" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{event.label}</h4>
                    {event.displayStatus === "active" && (
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{event.description}</p>
                    <div className="flex items-center gap-2">
                    {event.displayStatus !== "inactive" && (
                      <p className="text-xs text-muted-foreground">
                        {format(event.timestamp, "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    )}
                    {event.trackingUrl && (
                      <a
                        href={event.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                      >
                        Track Package <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {trackingEvents && trackingEvents.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <h5 className="font-medium mb-4">Tracking Updates</h5>
            <div className="space-y-3">
              {trackingEvents.map((event, index) => (
                <div key={index} className="flex justify-between items-start text-sm">
                  <div>
                    <p className="font-medium">{event.description}</p>
                    <p className="text-muted-foreground">{event.location}</p>
                  </div>
                  <span className="text-muted-foreground whitespace-nowrap">
                    {format(new Date(event.date), "MMM d, h:mm a")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrderTimeline;
