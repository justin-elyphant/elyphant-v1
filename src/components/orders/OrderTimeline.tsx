import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Clock, Truck, Home, X } from "lucide-react";
import { format } from "date-fns";

interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  status: "completed" | "active" | "inactive";
  icon: React.ComponentType<{ className?: string }>;
}

interface OrderTimelineProps {
  orderStatus: string;
  orderDate: string;
  trackingEvents?: Array<{
    date: string;
    location: string;
    description: string;
  }>;
}

const OrderTimeline = ({ orderStatus, orderDate, trackingEvents }: OrderTimelineProps) => {
  const getTimelineEvents = (): TimelineEvent[] => {
    const baseEvents: TimelineEvent[] = [
      {
        id: "placed",
        title: "Order Placed",
        description: "Your order has been received and confirmed",
        timestamp: new Date(orderDate),
        status: "completed",
        icon: Package
      },
      {
        id: "processing",
        title: "Processing",
        description: "We're preparing your items for shipment",
        timestamp: new Date(new Date(orderDate).getTime() + 2 * 60 * 60 * 1000), // +2 hours
        status: orderStatus === "pending" ? "inactive" : "completed",
        icon: Clock
      },
      {
        id: "shipped",
        title: "Shipped",
        description: "Your package is on its way",
        timestamp: new Date(new Date(orderDate).getTime() + 24 * 60 * 60 * 1000), // +1 day
        status: orderStatus === "shipped" ? "active" : orderStatus === "delivered" ? "completed" : "inactive",
        icon: Truck
      },
      {
        id: "delivered",
        title: "Delivered",
        description: "Package delivered successfully",
        timestamp: new Date(new Date(orderDate).getTime() + 3 * 24 * 60 * 60 * 1000), // +3 days
        status: orderStatus === "delivered" ? "completed" : "inactive",
        icon: Home
      }
    ];

    // Handle cancelled/failed orders
    if (orderStatus === "cancelled" || orderStatus === "failed") {
      baseEvents.push({
        id: "cancelled",
        title: orderStatus === "cancelled" ? "Order Cancelled" : "Order Failed",
        description: orderStatus === "cancelled" ? "Order was cancelled" : "Order processing failed",
        timestamp: new Date(),
        status: "completed",
        icon: X
      });
    }

    return baseEvents;
  };

  const events = getTimelineEvents();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="order-timeline space-y-6">
          {events.map((event, index) => {
            const Icon = event.icon;
            return (
              <div key={event.id} className="timeline-item">
                <div className={`timeline-marker ${event.status}`}>
                  <Icon className="h-3 w-3 text-white" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{event.title}</h4>
                    <Badge 
                      variant={
                        event.status === "completed" ? "default" : 
                        event.status === "active" ? "secondary" : 
                        "outline"
                      }
                      className="text-xs"
                    >
                      {event.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {event.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(event.timestamp, "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional tracking events if available */}
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