
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
import { ZincOrder } from "@/components/marketplace/zinc/types";

interface OrderItemsTableProps {
  order: ZincOrder;
}

const OrderItemsTable = ({ order }: OrderItemsTableProps) => {
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
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.items?.map((item, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">
                  {(item as any).product_name || item.name || "Product"}
                </TableCell>
                <TableCell className="text-right">{item.quantity}</TableCell>
                <TableCell className="text-right">
                  ${((item as any).unit_price || item.price || 0).toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  ${(((item as any).unit_price || item.price || 0) * item.quantity).toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        <div className="flex justify-end mt-6">
          <div className="w-full max-w-xs">
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Subtotal:</span>
              <span>${order.total?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Shipping:</span>
              <span>$0.00</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Tax:</span>
              <span>$0.00</span>
            </div>
            <div className="flex justify-between py-2 font-bold">
              <span>Total:</span>
              <span>${order.total?.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderItemsTable;
