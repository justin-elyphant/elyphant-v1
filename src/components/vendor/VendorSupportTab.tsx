
import React from "react";
import { toast } from "sonner";
import SupportRequestsCard from "./support/SupportRequestsCard";
import ReturnMetricsCard from "./support/ReturnMetricsCard";
import ReturnPolicyCard from "./support/ReturnPolicyCard";
import { mockRequests } from "./support/mockData";

const VendorSupportTab = () => {
  const handleSaveReturnPolicy = () => {
    toast.success("Return policy updated", {
      description: "Your return policy settings have been saved successfully.",
    });
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-medium text-slate-800 mb-2">Support & Returns</h2>
        <p className="text-slate-500 text-sm">
          Manage customer support requests and returns for your products
        </p>
      </div>

      <div className="space-y-6">
        <SupportRequestsCard requests={mockRequests} />
        <ReturnMetricsCard />
        <ReturnPolicyCard onSave={handleSaveReturnPolicy} />
      </div>
    </div>
  );
};

export default VendorSupportTab;
