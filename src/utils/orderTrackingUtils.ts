import { ZincOrder } from "@/components/marketplace/zinc/types";

export interface OrderStep {
  id: string;
  label: string;
  status: "completed" | "active" | "upcoming";
  timestamp?: string;
}

export interface ZincTimelineEvent {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  status: string;
  data?: any;
  source: "zinc" | "merchant";
}

/**
 * Resolve a human-readable carrier name from order data.
 * Maps Zinc internal codes (ZNLOGIC, AMZL) to customer-friendly names.
 */
export const resolveCarrierName = (order: ZincOrder): string => {
  const carrier = order.notes?.carrier || order.merchant_tracking_data?.carrier;
  const tracking = order.tracking_number || "";

  if (carrier === "AMZL" || carrier === "AMZN" || tracking.startsWith("TBA")) return "Amazon Logistics";
  if (carrier === "USPS") return "USPS";
  if (carrier === "UPS" || tracking.startsWith("1Z")) return "UPS";
  if (carrier === "FEDEX" || tracking.match(/^\d{12,14}$/)) return "FedEx";
  if (carrier === "ZNLOGIC" || tracking.startsWith("ZPY")) return "Amazon Logistics";
  if (carrier) return carrier;
  return "Carrier";
};

/**
 * Build the best external tracking URL from order data.
 * Priority: retailer URL > merchant data > carrier-specific > 17Track fallback.
 */
export const getExternalTrackingUrl = (order: ZincOrder): string | null => {
  const retailerUrl = order.notes?.zinc_tracking_url || order.notes?.retailer_tracking_url;
  if (retailerUrl) return retailerUrl;

  const merchantUrl = order.merchant_tracking_data?.merchant_order_ids?.[0]?.tracking_url;
  if (merchantUrl) return merchantUrl;

  const tracking = order.tracking_number;
  if (!tracking) return null;

  if (tracking.startsWith("TBA")) return `https://track.amazon.com/tracking/${tracking}`;
  if (tracking.startsWith("1Z")) return `https://www.ups.com/track?tracknum=${tracking}`;
  if (tracking.match(/^\d{12,14}$/)) return `https://www.fedex.com/apps/fedextrack/?action=track&tracknumbers=${tracking}`;

  return `https://t.17track.net/en#nums=${tracking}`;
};

/**
 * Compute the canonical 4-step order progression from status + Zinc timeline events.
 * Single source of truth used by TrackingInfoCard, OrderProgressStepper, and OrderTimeline.
 */
export const computeOrderSteps = (
  status: string,
  zincTimelineEvents: ZincTimelineEvent[] = [],
  orderDate?: string,
  fulfilledAt?: string
): OrderStep[] => {
  const stepIds = ["ordered", "processing", "shipped", "delivered"];

  // Map order status to the highest completed step index
  const statusToIndex: Record<string, number> = {
    pending: 0,
    payment_confirmed: 0,
    awaiting_funds: 0,
    processing: 1,
    submitted_to_zinc: 1,
    shipped: 2,
    delivered: 3,
    cancelled: 0,
    failed: 0,
  };

  let currentIndex = statusToIndex[status] ?? 0;

  // Override from zinc timeline events if they indicate further progress
  if (zincTimelineEvents.length > 0) {
    const eventToStep: Record<string, number> = {
      "request.placed": 0,
      "request.finished": 1,
      "tracking.available": 2,
      "shipment.shipped": 2,
      "shipment.delivered": 3,
    };
    const maxFromEvents = Math.max(
      ...zincTimelineEvents.map((e) => eventToStep[e.type] ?? -1)
    );
    if (maxFromEvents > currentIndex) currentIndex = maxFromEvents;
  }

  // Extract timestamps from zinc events
  const placedEvent = zincTimelineEvents.find((e) => e.type === "request.placed");
  const shippedEvent = zincTimelineEvents.find(
    (e) => e.type === "shipment.shipped" || e.type === "tracking.available"
  );
  const deliveredEvent = zincTimelineEvents.find((e) => e.type === "shipment.delivered");

  const stepTimestamps: Record<string, string | undefined> = {
    ordered: placedEvent?.timestamp || orderDate,
    processing: undefined,
    shipped: shippedEvent?.timestamp,
    delivered: deliveredEvent?.timestamp || (currentIndex >= 3 ? fulfilledAt : undefined),
  };

  return stepIds.map((id, index) => ({
    id,
    label: id === "ordered" ? "Ordered" : id.charAt(0).toUpperCase() + id.slice(1),
    status: index < currentIndex ? "completed" : index === currentIndex ? "active" : "upcoming",
    timestamp: stepTimestamps[id],
  }));
};
