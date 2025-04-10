
import React from "react";
import { Customer } from "../mockData";

interface DetailsTabProps {
  customer: Customer;
}

const DetailsTab: React.FC<DetailsTabProps> = ({ customer }) => {
  return (
    <div className="grid grid-cols-2 gap-6">
      <div>
        <h3 className="text-base font-medium mb-3">Addresses</h3>
        <div className="space-y-4">
          {customer.addresses.map((address, index) => (
            <div key={index} className="border rounded-md p-4">
              <div className="font-medium mb-1">{address.type} Address</div>
              <div className="text-sm text-muted-foreground">{address.street}</div>
              <div className="text-sm text-muted-foreground">
                {address.city}, {address.state} {address.zip}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-base font-medium mb-3">Payment Methods</h3>
        <div className="border rounded-md p-4">
          <div className="font-medium mb-1">Default Payment</div>
          <div className="text-sm text-muted-foreground">{customer.paymentMethod}</div>
        </div>
      </div>
    </div>
  );
};

export default DetailsTab;
