
import React from "react";
import { Clock, Package, CreditCard, AlertCircle } from "lucide-react";
import { Customer } from "./mockData";

interface CustomerStatCardsProps {
  customer: Customer;
}

const CustomerStatCards: React.FC<CustomerStatCardsProps> = ({ customer }) => {
  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <div className="bg-gray-50 p-4 rounded-md">
        <div className="text-sm text-muted-foreground">Customer Since</div>
        <div className="font-medium mt-1 flex items-center gap-1">
          <Clock className="h-4 w-4 text-muted-foreground" />
          {customer.customerSince}
        </div>
      </div>
      <div className="bg-gray-50 p-4 rounded-md">
        <div className="text-sm text-muted-foreground">Total Orders</div>
        <div className="font-medium mt-1 flex items-center gap-1">
          <Package className="h-4 w-4 text-muted-foreground" />
          {customer.orderCount}
        </div>
      </div>
      <div className="bg-gray-50 p-4 rounded-md">
        <div className="text-sm text-muted-foreground">Total Spent</div>
        <div className="font-medium mt-1 flex items-center gap-1">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          {customer.totalSpent}
        </div>
      </div>
      <div className="bg-gray-50 p-4 rounded-md">
        <div className="text-sm text-muted-foreground">Returns</div>
        <div className="font-medium mt-1 flex items-center gap-1">
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
          {customer.returns}
        </div>
      </div>
    </div>
  );
};

export default CustomerStatCards;
