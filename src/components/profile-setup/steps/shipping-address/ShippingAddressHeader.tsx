
import React from "react";

const ShippingAddressHeader: React.FC = () => {
  return (
    <div className="text-center mb-6">
      <h3 className="text-lg font-medium">Where should gifts be delivered?</h3>
      <p className="text-sm text-muted-foreground">
        Your address is only shared with friends you explicitly allow
      </p>
    </div>
  );
};

export default ShippingAddressHeader;
