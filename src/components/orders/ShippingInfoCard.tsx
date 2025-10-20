
import React from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { ZincOrder } from "@/components/marketplace/zinc/types";

interface ShippingInfoCardProps {
  order: ZincOrder;
}

const ShippingInfoCard = ({ order }: ShippingInfoCardProps) => {
  // Smart address extraction
  let shippingAddress: any = {};
  let recipientName = "Customer";
  let isGiftRecipient = false;

  // Check if this is a single-recipient gift order
  if ((order as any).has_multiple_recipients === false && 
      (order as any).delivery_groups && 
      (order as any).delivery_groups.length > 0) {
    
    const deliveryGroup = (order as any).delivery_groups[0];
    const addr = deliveryGroup.shippingAddress;
    
    if (addr) {
      shippingAddress = {
        address_line1: addr.address_line1 || addr.address,
        address_line2: addr.address_line2 || addr.addressLine2,
        city: addr.city,
        state: addr.state,
        zip_code: addr.zip_code || addr.zipCode,
        country: addr.country || 'US'
      };
      recipientName = addr.name || 
        `${addr.first_name || ''} ${addr.last_name || ''}`.trim() || 
        deliveryGroup.connectionName || "Recipient";
      isGiftRecipient = true;
    }
  }
  
  // Fallback to shipping_info if not a gift order
  if (!isGiftRecipient) {
    const shippingInfo = (order as any).shipping_info || {};
    recipientName = shippingInfo.name || order.customerName || "Customer";
    shippingAddress = shippingInfo.address || shippingInfo;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shipping Information</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">
          {order.status === "delivered" ? "Delivered to:" : "Shipping to:"}
        </p>
        <div className="mb-4">
          <p className="font-medium">{recipientName}</p>
          {shippingAddress.address_line1 && <p>{shippingAddress.address_line1}</p>}
          {shippingAddress.address_line2 && <p>{shippingAddress.address_line2}</p>}
          {shippingAddress.city && shippingAddress.state && shippingAddress.zip_code && (
            <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.zip_code}</p>
          )}
          {shippingAddress.country && <p>{shippingAddress.country}</p>}
        </div>
        {(order.status === "shipped" || order.status === "delivered") && (() => {
          // Extract tracking info from merchant_tracking_data
          const trackingData = (order as any).merchant_tracking_data?.tracking?.[0];
          const trackingNumber = order.tracking_number || trackingData?.tracking_number;
          const carrier = trackingData?.carrier;
          const trackingUrl = trackingData?.tracking_url || trackingData?.retailer_tracking_url;
          
          if (!trackingNumber) return null;
          
          return (
            <div className="mt-4 space-y-2">
              <p className="font-medium">Tracking Information:</p>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tracking Number:</span>
                  <span className="font-medium">{trackingNumber}</span>
                </div>
                {carrier && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Carrier:</span>
                    <span className="font-medium">{carrier}</span>
                  </div>
                )}
                {trackingUrl && (
                  <a 
                    href={trackingUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm block mt-2"
                  >
                    Track Package →
                  </a>
                )}
              </div>
            </div>
          );
        })()}
      </CardContent>
    </Card>
  );
};

export default ShippingInfoCard;
