
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Customer } from "../mockData";

interface OrdersTabProps {
  customer: Customer;
}

const OrdersTab: React.FC<OrdersTabProps> = ({ customer }) => {
  return (
    <div className="border rounded-md overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left px-4 py-3 font-medium">Order ID</th>
            <th className="text-left px-4 py-3 font-medium">Date</th>
            <th className="text-left px-4 py-3 font-medium">Status</th>
            <th className="text-left px-4 py-3 font-medium">Total</th>
            <th className="text-right px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {customer.orders.map((order) => (
            <tr key={order.id} className="hover:bg-gray-50">
              <td className="px-4 py-3">{order.id}</td>
              <td className="px-4 py-3">{order.date}</td>
              <td className="px-4 py-3">
                <Badge variant={
                  order.status === 'Delivered' ? 'default' : 
                  order.status === 'Shipped' ? 'default' : 'secondary'
                } className={order.status === 'Delivered' ? 'bg-green-500 hover:bg-green-600' : ''}>
                  {order.status}
                </Badge>
              </td>
              <td className="px-4 py-3">{order.total}</td>
              <td className="px-4 py-3 text-right">
                <Button variant="ghost" size="sm">View</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OrdersTab;
