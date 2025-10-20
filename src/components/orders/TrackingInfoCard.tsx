import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Copy, ExternalLink, Truck } from "lucide-react";
import { toast } from "sonner";
import { ZincOrder } from "@/components/marketplace/zinc/types";

interface TrackingInfoCardProps {
  order: ZincOrder;
}

const TrackingInfoCard = ({ order }: TrackingInfoCardProps) => {
  const handleCopyTracking = () => {
    if (order.tracking_number) {
      navigator.clipboard.writeText(order.tracking_number);
      toast.success("Tracking number copied to clipboard");
    }
  };

  const getCarrierInfo = (trackingNumber?: string) => {
    if (!trackingNumber) return null;
    
    // Enhanced carrier detection with proper Zinc support
    if (trackingNumber.startsWith("1Z")) {
      return { 
        name: "UPS", 
        logo: "🚚", 
        url: `https://www.ups.com/track?tracknum=${trackingNumber}`,
        fallbackUrl: `https://t.17track.net/en#nums=${trackingNumber}`
      };
    }
    if (trackingNumber.match(/^\d{12,14}$/)) {
      return { 
        name: "FedEx", 
        logo: "📦", 
        url: `https://www.fedex.com/apps/fedextrack/?action=track&tracknumbers=${trackingNumber}`,
        fallbackUrl: `https://t.17track.net/en#nums=${trackingNumber}`
      };
    }
    // Zinc tracking numbers (ZPY prefix) - route to 17.TRACK
    if (trackingNumber.startsWith("ZPY")) {
      return { 
        name: "Zinc Logistics", 
        logo: "📋", 
        url: `https://t.17track.net/en#nums=${trackingNumber}`,
        fallbackUrl: `https://track.amazon.com/tracking/${trackingNumber}`
      };
    }
    // Amazon TBA numbers
    if (trackingNumber.startsWith("TBA")) {
      return { 
        name: "Amazon Logistics", 
        logo: "📋", 
        url: `https://track.amazon.com/tracking/${trackingNumber}`,
        fallbackUrl: `https://t.17track.net/en#nums=${trackingNumber}`
      };
    }
    // Universal fallback - use 17.TRACK for unknown carriers
    return { 
      name: "Universal Tracker", 
      logo: "🚛", 
      url: `https://t.17track.net/en#nums=${trackingNumber}`,
      fallbackUrl: null
    };
  };

  const carrierInfo = getCarrierInfo(order.tracking_number);

  if (!order.tracking_number) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Tracking Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Tracking Number
            </label>
            <div className="flex items-center gap-2 mt-1 min-w-0">
              <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono min-w-0 overflow-hidden" style={{ wordBreak: "break-all", overflowWrap: "break-word" }}>
                {order.tracking_number}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyTracking}
                className="h-9 w-9 p-0 flex-shrink-0"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              if (carrierInfo?.url) {
                window.open(carrierInfo.url, '_blank');
              } else {
                toast.info("Tracking link not available for this carrier");
              }
            }}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Track Package
          </Button>
        </div>

        {order.status === "shipped" && (
          <div className="mt-4 p-3 border-l-4 border-primary bg-primary/5 rounded-r-lg">
            <p className="text-sm">
              <strong>Package is on its way!</strong> You'll receive updates as your package moves through our network.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TrackingInfoCard;