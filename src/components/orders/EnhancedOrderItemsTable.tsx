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

interface EnhancedOrderItemsTableProps {
  order: ZincOrder;
  onReorder?: (item: any) => void;
  onReview?: (item: any) => void;
}

const EnhancedOrderItemsTable = ({ 
  order, 
  onReorder, 
  onReview 
}: EnhancedOrderItemsTableProps) => {
  const handleReorder = (item: any) => {
    onReorder?.(item);
  };

  const handleReview = (item: any) => {
    onReview?.(item);
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
            <TableRow>
              <TableHead className="w-16">Image</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.items?.map((item, index) => (
              <TableRow key={index}>
                <TableCell>
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                    {((item as any).product_image || (item as any).image_url || (item as any).image) ? (
                      <img 
                        src={(item as any).product_image || (item as any).image_url || (item as any).image} 
                        alt={(item as any).product_name || item.name || "Product"}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
                      <span className="text-xs text-primary font-medium">
                        {((item as any).product_name || item.name || "P").charAt(0)}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <p className="font-medium">
                      {(item as any).product_name || item.name || "Product"}
                    </p>
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
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReorder(item)}
                      className="h-8 w-8 p-0"
                    >
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                    {order.status === "delivered" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReview(item)}
                        className="h-8 w-8 p-0"
                      >
                        <Star className="h-3 w-3" />
                      </Button>
                    )}
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
                <span>${order.total?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Shipping:</span>
                <span className="text-green-600">Free</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Tax:</span>
                <span>$0.00</span>
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