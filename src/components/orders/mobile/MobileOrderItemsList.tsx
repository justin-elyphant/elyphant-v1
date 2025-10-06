import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getOrderPricingBreakdown } from "@/utils/orderPricingUtils";
import { ZincOrder } from "@/components/marketplace/zinc/types";
import MobileOrderItemCard from "./MobileOrderItemCard";

interface MobileOrderItemsListProps {
  order: ZincOrder;
  onReorder?: (item: any) => void;
}

const MobileOrderItemsList = ({ 
  order, 
  onReorder
}: MobileOrderItemsListProps) => {
  // Get pricing breakdown for consistent display (handles legacy orders)
  const pricingBreakdown = getOrderPricingBreakdown(order);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Items</CardTitle>
        <CardDescription>
          {order.items?.length} item{order.items?.length !== 1 ? 's' : ''} in your order
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Order Items */}
        <div className="space-y-3">
          {order.items?.map((item, index) => {
            const product_id = order.products?.[index]?.product_id;
            const mergedItem = product_id ? { ...item, product_id } : item;
            return (
              <MobileOrderItemCard
                key={index}
                item={mergedItem}
                orderStatus={order.status}
                onReorder={onReorder}
              />
            );
          })}
        </div>
        
        {/* Order Summary */}
        <div className="border-t pt-4 mt-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-body-base text-muted-foreground">Subtotal:</span>
              <span className="text-body-base">${pricingBreakdown.subtotal.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-body-base text-muted-foreground">Shipping:</span>
              <span className={`text-body-base ${pricingBreakdown.shipping_cost > 0 ? "" : "text-success"}`}>
                {pricingBreakdown.shipping_cost > 0 ? `$${pricingBreakdown.shipping_cost.toFixed(2)}` : "Free"}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-body-base text-muted-foreground">Tax:</span>
              <span className="text-body-base">${pricingBreakdown.tax_amount.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-body-base text-muted-foreground">
                  {pricingBreakdown.gifting_fee_name}:
                </span>
                <div className="group relative">
                  <button className="text-xs text-muted-foreground hover:text-foreground transition-colors touch-target-44 w-5 h-5 flex items-center justify-center">
                    ⓘ
                  </button>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-popover text-popover-foreground text-xs rounded-md shadow-md border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 w-64">
                    {pricingBreakdown.gifting_fee_description}
                  </div>
                </div>
              </div>
              <span className="text-body-base">${pricingBreakdown.gifting_fee.toFixed(2)}</span>
            </div>
            
            <div className="border-t pt-3">
              <div className="flex justify-between items-center">
                <span className="text-heading-4 font-bold">Total:</span>
                <span className="text-heading-4 font-bold">${order.total?.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MobileOrderItemsList;