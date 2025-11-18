import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RotateCcw, Star } from "lucide-react";
import { ZincOrder } from "@/components/marketplace/zinc/types";
import { getOrderPricingBreakdown } from "@/utils/orderPricingUtils";
import EnhancedOrderItemImage from "./EnhancedOrderItemImage";

interface EnhancedOrderItemsTableProps {
  order: ZincOrder;
  onReorder?: (item: any) => void;
}

const EnhancedOrderItemsTable = ({ 
  order, 
  onReorder
}: EnhancedOrderItemsTableProps) => {
  // Get pricing breakdown for consistent display (handles legacy orders)
  const pricingBreakdown = getOrderPricingBreakdown(order);

  const handleReorder = (item: any) => {
    onReorder?.(item);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Items</CardTitle>
        <CardDescription>
          {order.items?.length} item{order.items?.length !== 1 ? 's' : ''} in your order
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-20">Image</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right w-40">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.items?.map((item, index) => (
              <TableRow 
                key={index}
                className="hover:bg-muted/50 transition-colors duration-200"
              >
                <TableCell>
                  <EnhancedOrderItemImage 
                    item={item} 
                    size="lg"
                    className="hover:scale-105 transition-transform duration-200"
                  />
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <p className="font-medium leading-tight">
                      {((item as any).product_name || (item as any).title || item.name || "Product")
                        .replace(/,?\s*\d+\s*(EA|ea|each|pack|ct|count|piece|pc|pcs|unit|units)\.?$/i, '')
                        .trim()}
                    </p>
                    {(item as any).variation_text && (
                      <p className="text-xs text-muted-foreground">
                        {(item as any).variation_text}
                      </p>
                    )}
                    {(item as any).brand && (
                      <p className="text-sm text-muted-foreground">
                        {(item as any).brand}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">{item.quantity}</TableCell>
                <TableCell className="text-right">
                  ${((item as any).unit_price || item.price || 0).toFixed(2)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  ${(((item as any).unit_price || item.price || 0) * item.quantity).toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReorder(item)}
                      className="h-9 px-3 hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Reorder
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        <div className="flex justify-end mt-6">
          <div className="w-full max-w-xs">
            <div className="space-y-2">
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>${pricingBreakdown.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Shipping:</span>
                <span className={pricingBreakdown.shipping_cost > 0 ? "" : "text-green-600"}>
                  {pricingBreakdown.shipping_cost > 0 ? `$${pricingBreakdown.shipping_cost.toFixed(2)}` : "Free"}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Tax:</span>
                <span>${pricingBreakdown.tax_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1">
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">{pricingBreakdown.gifting_fee_name}:</span>
                  <div className="group relative">
                    <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                      ⓘ
                    </button>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-popover text-popover-foreground text-xs rounded-md shadow-md border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 w-64">
                      {pricingBreakdown.gifting_fee_description}
                    </div>
                  </div>
                </div>
                <span>${pricingBreakdown.gifting_fee.toFixed(2)}</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between py-1 text-lg font-bold">
                  <span>Total:</span>
                  <span>${order.total?.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedOrderItemsTable;