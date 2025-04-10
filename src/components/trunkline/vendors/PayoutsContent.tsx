
import React from "react";
import { DollarSign } from "lucide-react";
import EmptyVendorsState from "./EmptyVendorsState";

const PayoutsContent: React.FC = () => {
  return (
    <EmptyVendorsState 
      icon={<DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />}
      message="Payout information will appear here once vendors complete Stripe Connect onboarding."
    />
  );
};

export default PayoutsContent;
