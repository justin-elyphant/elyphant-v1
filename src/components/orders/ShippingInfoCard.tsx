
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

  // Priority 1: Check for scheduled gift / modern line_items.items[0].recipient_shipping
  const lineItems = (order as any).items || [];
  const isScheduledGift = (order as any).isScheduledGift || (order as any).scheduled_delivery_date;
  
  if (lineItems.length > 0) {
    const firstItem = lineItems[0];
    const recipientAddr = firstItem?.recipient_shipping || firstItem?.shippingAddress;
    
    if (recipientAddr && (isScheduledGift || firstItem?.recipient_id)) {
      shippingAddress = {
        address_line1: recipientAddr.address_line1 || recipientAddr.address,
        address_line2: recipientAddr.address_line2 || recipientAddr.addressLine2,
        city: recipientAddr.city,
        state: recipientAddr.state,
        zip_code: recipientAddr.zip_code || recipientAddr.zipCode || recipientAddr.postal_code,
        country: recipientAddr.country || 'US'
      };
      recipientName = recipientAddr.name || firstItem.recipient_name || "Recipient";
      isGiftRecipient = true;
    }
  }

  // Priority 2: Legacy delivery_groups pattern
  if (!isGiftRecipient &&
      (order as any).has_multiple_recipients === false && 
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
  
  // Priority 3: Fallback to shipping_info if not a gift order
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
          {/* Privacy: Only show city/state for gift recipients */}
          {isGiftRecipient ? (
            <>
              {shippingAddress.city && shippingAddress.state && (
                <p>{shippingAddress.city}, {shippingAddress.state}</p>
              )}
              <p>{shippingAddress.country || 'United States'}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Full address securely stored for delivery
              </p>
            </>
          ) : (
            <>
              {shippingAddress.address_line1 && <p>{shippingAddress.address_line1}</p>}
              {shippingAddress.address_line2 && <p>{shippingAddress.address_line2}</p>}
              {shippingAddress.city && shippingAddress.state && shippingAddress.zip_code && (
                <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.zip_code}</p>
              )}
              {shippingAddress.country && <p>{shippingAddress.country}</p>}
            </>
          )}
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
