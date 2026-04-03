import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, Truck, Package, Clock, Home, CheckCircle2, Circle, Camera } from "lucide-react";
import { toast } from "sonner";
import { ZincOrder } from "@/components/marketplace/zinc/types";
import { format } from "date-fns";

interface TrackingInfoCardProps {
  order: ZincOrder;
}

type StepStatus = "completed" | "active" | "upcoming";

interface TrackingStep {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  status: StepStatus;
  timestamp?: string;
}

const resolveCarrierName = (order: ZincOrder): string => {
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

const getExternalTrackingUrl = (order: ZincOrder): string | null => {
  // Priority 1: Amazon retailer tracking URL from notes
  const retailerUrl = order.notes?.zinc_tracking_url || order.notes?.retailer_tracking_url;
  if (retailerUrl) return retailerUrl;

  // Priority 2: Merchant tracking data
  const merchantUrl = order.merchant_tracking_data?.merchant_order_ids?.[0]?.tracking_url;
  if (merchantUrl) return merchantUrl;

  const tracking = order.tracking_number;
  if (!tracking) return null;

  // Priority 3: Carrier-specific URLs
  if (tracking.startsWith("TBA")) return `https://track.amazon.com/tracking/${tracking}`;
  if (tracking.startsWith("1Z")) return `https://www.ups.com/track?tracknum=${tracking}`;
  if (tracking.match(/^\d{12,14}$/)) return `https://www.fedex.com/apps/fedextrack/?action=track&tracknumbers=${tracking}`;

  // Fallback: 17Track
  return `https://t.17track.net/en#nums=${tracking}`;
};

const TrackingInfoCard = ({ order }: TrackingInfoCardProps) => {
  const handleCopyTracking = () => {
    const trackingNum = order.tracking_number || order.notes?.retailer_tracking_number;
    if (trackingNum) {
      navigator.clipboard.writeText(trackingNum);
      toast.success("Tracking number copied");
    }
  };

  const carrierName = resolveCarrierName(order);
  const externalUrl = getExternalTrackingUrl(order);
  const deliveryProofImage = order.notes?.delivery_proof_image;
  const deliveryStatus = order.notes?.zinc_delivery_status;
  const displayTrackingNumber = order.notes?.retailer_tracking_number || order.tracking_number;

  // Build timeline steps from order data
  const buildSteps = (): TrackingStep[] => {
    const status = order.status;
    const orderDate = order.created_at || order.date;

    // Find zinc timeline events if available
    const zincEvents = order.zinc_timeline_events || [];
    const placedEvent = zincEvents.find((e: any) => e.type === "request.placed");
    const shippedEvent = zincEvents.find((e: any) => e.type === "shipment.shipped" || e.type === "tracking.available");
    const deliveredEvent = zincEvents.find((e: any) => e.type === "shipment.delivered");

    const getStatus = (stepId: string): StepStatus => {
      const statusOrder = ["ordered", "processing", "shipped", "in_transit", "delivered"];
      const currentIndex = status === "delivered" ? 4
        : status === "shipped" ? 3
        : status === "processing" ? 1
        : 0;
      const stepIndex = statusOrder.indexOf(stepId);
      if (stepIndex < currentIndex) return "completed";
      if (stepIndex === currentIndex) return "active";
      return "upcoming";
    };

    return [
      {
        id: "ordered",
        label: "Ordered",
        icon: Package,
        status: getStatus("ordered"),
        timestamp: placedEvent?.timestamp || orderDate,
      },
      {
        id: "processing",
        label: "Processing",
        icon: Clock,
        status: getStatus("processing"),
      },
      {
        id: "shipped",
        label: "Shipped",
        icon: Truck,
        status: getStatus("shipped"),
        timestamp: shippedEvent?.timestamp,
      },
      {
        id: "in_transit",
        label: "In Transit",
        icon: Truck,
        status: getStatus("in_transit"),
      },
      {
        id: "delivered",
        label: "Delivered",
        icon: Home,
        status: getStatus("delivered"),
        timestamp: deliveredEvent?.timestamp || (status === "delivered" ? order.fulfilled_at : undefined),
      },
    ];
  };

  const steps = buildSteps();
  const completedCount = steps.filter(s => s.status === "completed").length;
  const activeStep = steps.find(s => s.status === "active");
  const progressPercent = ((completedCount + (activeStep ? 0.5 : 0)) / steps.length) * 100;

  // Don't render if no tracking info at all
  const hasTrackingInfo = displayTrackingNumber || deliveryStatus || order.status === "shipped" || order.status === "delivered";
  if (!hasTrackingInfo) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Package Tracking
          </span>
          <span className="text-sm font-normal text-muted-foreground">
            {carrierName}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Progress Bar */}
        <div className="space-y-3">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-foreground rounded-full transition-all duration-700"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Step indicators */}
          <div className="flex justify-between">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.id} className="flex flex-col items-center" style={{ width: `${100 / steps.length}%` }}>
                  {step.status === "completed" ? (
                    <CheckCircle2 className="h-4 w-4 text-foreground mb-1" />
                  ) : step.status === "active" ? (
                    <div className="h-4 w-4 rounded-full border-2 border-destructive bg-destructive/10 mb-1" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground/40 mb-1" />
                  )}
                  <span className={`text-[10px] text-center leading-tight ${
                    step.status === "upcoming" ? "text-muted-foreground/40" : "text-foreground"
                  }`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Current Status Summary */}
        {activeStep && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium text-foreground">
              {order.status === "delivered"
                ? "Package delivered"
                : order.status === "shipped"
                ? "Your package is on its way"
                : "Order is being prepared"}
            </p>
            {activeStep.timestamp && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {format(new Date(activeStep.timestamp), "MMM d, yyyy 'at' h:mm a")}
              </p>
            )}
          </div>
        )}

        {/* Delivered confirmation with proof */}
        {order.status === "delivered" && (
          <div className="space-y-3">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium text-foreground">
                ✓ Delivered
              </p>
              {steps.find(s => s.id === "delivered")?.timestamp && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {format(new Date(steps.find(s => s.id === "delivered")!.timestamp!), "EEEE, MMM d, yyyy 'at' h:mm a")}
                </p>
              )}
            </div>

            {deliveryProofImage && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Camera className="h-3 w-3" />
                  Delivery Photo
                </p>
                <div className="rounded-lg overflow-hidden border bg-muted">
                  <img
                    src={deliveryProofImage}
                    alt="Delivery proof"
                    className="w-full h-auto object-cover max-h-48"
                    loading="lazy"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tracking Number */}
        {displayTrackingNumber && (
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Tracking Number
            </label>
            <div className="flex items-center gap-2 mt-1">
              <code className="flex-1 px-2.5 py-1.5 bg-muted rounded text-xs font-mono" style={{ wordBreak: "break-all" }}>
                {displayTrackingNumber}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyTracking}
                className="h-7 w-7 p-0 flex-shrink-0"
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* External tracking link — secondary */}
        {externalUrl && (
          <a
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1.5"
          >
            View on carrier site
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </CardContent>
    </Card>
  );
};

export default TrackingInfoCard;
