import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Clock, Truck, Home, X, ExternalLink } from "lucide-react";
import { format } from "date-fns";

interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  status: "completed" | "active" | "inactive";
  icon: React.ComponentType<{ className?: string }>;
  trackingUrl?: string;
  source?: 'zinc' | 'merchant' | 'estimated';
}

interface ZincTimelineEvent {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  status: string;
  data?: any;
  source: 'zinc' | 'merchant';
}

interface OrderTimelineProps {
  orderStatus: string;
  orderDate: string;
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

const OrderTimeline = ({ 
  orderStatus, 
  orderDate, 
  trackingEvents, 
  zincTimelineEvents = [], 
  merchantTrackingData 
}: OrderTimelineProps) => {
  
  const getIconForEventType = (eventType: string): React.ComponentType<{ className?: string }> => {
    const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
      'request.placed': Package,
      'request.finished': Clock,
      'shipment.shipped': Truck,
      'shipment.delivered': Home,
      'request.failed': X,
      'request.cancelled': X,
      'tracking.available': ExternalLink,
    };
    return iconMap[eventType] || Package;
  };

  const getStatusFromZincEvent = (eventType: string, orderStatus: string): "completed" | "active" | "inactive" => {
    // Use the order status to override event status for final states
    if (orderStatus === "delivered") {
      return "completed";
    }
    
    const activeEvents = ['shipment.shipped'];
    const finalEvents = ['shipment.delivered'];
    
    if (finalEvents.includes(eventType)) return "completed";
    if (activeEvents.includes(eventType) && orderStatus === "shipped") return "active";
    return "completed";
  };

  const synthesizeTimelineFromStatus = (): TimelineEvent[] => {
    const baseTime = new Date(orderDate);
    
    // Find actual zinc events for timestamps
    const placedEvent = zincTimelineEvents.find(e => e.type === 'request.placed');
    const processingEvent = zincTimelineEvents.find(e => e.type === 'request.finished');
    const shippedEvent = zincTimelineEvents.find(e => 
      e.type === 'shipment.shipped' || e.type === 'tracking.available'
    );
    const deliveredEvent = zincTimelineEvents.find(e => e.type === 'shipment.delivered');
    
    // Get merchant tracking data for delivery date
    const deliveryDate = merchantTrackingData?.delivery_dates?.[0];
    
    const timeline: TimelineEvent[] = [
      {
        id: "placed",
        title: "Order Placed",
        description: "Your order has been received and confirmed",
        timestamp: placedEvent ? new Date(placedEvent.timestamp) : baseTime,
        status: "completed",
        icon: Package,
        source: placedEvent ? 'zinc' : 'estimated'
      },
      {
        id: "processing",
        title: "Processing",
        description: "We're preparing your items for shipment",
        timestamp: processingEvent 
          ? new Date(processingEvent.timestamp) 
          : new Date(baseTime.getTime() + 2 * 60 * 60 * 1000),
        status: "completed",
        icon: Clock,
        source: processingEvent ? 'zinc' : 'estimated'
      },
      {
        id: "shipped",
        title: "Shipped",
        description: "Your package is on its way",
        timestamp: shippedEvent 
          ? new Date(shippedEvent.timestamp) 
          : new Date(baseTime.getTime() + 24 * 60 * 60 * 1000),
        status: "completed",
        icon: Truck,
        source: shippedEvent ? 'zinc' : 'estimated',
        trackingUrl: shippedEvent?.data?.tracking_url || merchantTrackingData?.merchant_order_ids?.[0]?.tracking_url
      },
      {
        id: "delivered",
        title: "Delivered",
        description: "Package delivered successfully",
        timestamp: deliveredEvent 
          ? new Date(deliveredEvent.timestamp)
          : deliveryDate?.date 
            ? new Date(deliveryDate.date)
            : new Date(baseTime.getTime() + 3 * 24 * 60 * 60 * 1000),
        status: "completed",
        icon: Home,
        source: deliveredEvent ? 'zinc' : deliveryDate ? 'merchant' : 'estimated'
      }
    ];
    
    return timeline;
  };

  const getTimelineEvents = (): TimelineEvent[] => {
    // PRIORITY 1: If order is delivered, synthesize complete timeline
    if (orderStatus === "delivered") {
      return synthesizeTimelineFromStatus();
    }
    
    // PRIORITY 2: If order is shipped, synthesize up to shipped
    if (orderStatus === "shipped") {
      const timeline = synthesizeTimelineFromStatus();
      // Mark delivered as inactive
      return timeline.map(event => 
        event.id === "delivered" 
          ? { ...event, status: "inactive" as const } 
          : event
      );
    }
    
    // PRIORITY 3: Use Zinc timeline events for in-progress orders
    if (zincTimelineEvents && zincTimelineEvents.length > 0) {
      // Deduplicate events by type - keep only the latest of each type
      const eventsByType = new Map<string, ZincTimelineEvent>();
      zincTimelineEvents.forEach(event => {
        const existing = eventsByType.get(event.type);
        if (!existing || new Date(event.timestamp) > new Date(existing.timestamp)) {
          eventsByType.set(event.type, event);
        }
      });
      
      const uniqueEvents = Array.from(eventsByType.values());
      
      const zincEvents: TimelineEvent[] = uniqueEvents.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        timestamp: new Date(event.timestamp),
        status: getStatusFromZincEvent(event.type, orderStatus),
        icon: getIconForEventType(event.type),
        source: event.source,
        trackingUrl: event.data?.tracking_url
      }));

      // Add tracking URLs from merchant data if available
      if (merchantTrackingData?.merchant_order_ids) {
        merchantTrackingData.merchant_order_ids.forEach(merchant => {
          if (merchant.tracking_url) {
            const existingEvent = zincEvents.find(e => e.id.includes('shipped') || e.id.includes('tracking'));
            if (existingEvent) {
              existingEvent.trackingUrl = merchant.tracking_url;
            }
          }
        });
      }

      return zincEvents.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }

    // PRIORITY 4: Fallback to estimated timeline
    const baseEvents: TimelineEvent[] = [
      {
        id: "placed",
        title: "Order Placed",
        description: "Your order has been received and confirmed",
        timestamp: new Date(orderDate),
        status: "completed",
        icon: Package,
        source: 'estimated'
      },
      {
        id: "processing",
        title: "Processing",
        description: "We're preparing your items for shipment",
        timestamp: new Date(new Date(orderDate).getTime() + 2 * 60 * 60 * 1000),
        status: orderStatus === "pending" ? "inactive" : "completed",
        icon: Clock,
        source: 'estimated'
      },
      {
        id: "shipped",
        title: "Shipped",
        description: "Your package is on its way",
        timestamp: new Date(new Date(orderDate).getTime() + 24 * 60 * 60 * 1000),
        status: orderStatus === "shipped" ? "active" : orderStatus === "delivered" ? "completed" : "inactive",
        icon: Truck,
        source: 'estimated'
      },
      {
        id: "delivered",
        title: "Delivered",
        description: "Package delivered successfully",
        timestamp: new Date(new Date(orderDate).getTime() + 3 * 24 * 60 * 60 * 1000),
        status: orderStatus === "delivered" ? "completed" : "inactive",
        icon: Home,
        source: 'estimated'
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
        icon: X,
        source: 'estimated'
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
                     {event.source === 'zinc' && (
                       <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                         Live
                       </Badge>
                     )}
                   </div>
                   <p className="text-sm text-muted-foreground">
                     {event.description}
                   </p>
                   <div className="flex items-center gap-2">
                     <p className="text-xs text-muted-foreground">
                       {format(event.timestamp, "MMM d, yyyy 'at' h:mm a")}
                     </p>
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