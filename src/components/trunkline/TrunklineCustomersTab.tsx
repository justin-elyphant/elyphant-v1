
import React, { useState } from "react";
import CustomerSearch from "./customers/CustomerSearch";
import CustomerDetails from "./customers/CustomerDetails";
import { Customer } from "./customers/mockData";

const TrunklineCustomersTab = () => {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  return (
    <div className="space-y-6">
      <CustomerSearch onSelectCustomer={setSelectedCustomer} />
      {selectedCustomer && <CustomerDetails customer={selectedCustomer} />}
    </div>
  );
};

export default TrunklineCustomersTab;
