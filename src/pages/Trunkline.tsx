
import React from "react";
import { Routes, Route } from "react-router-dom";
import { ProductProvider } from "@/contexts/ProductContext";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { TrunklineSidebar } from "@/components/trunkline/TrunklineSidebar";
import TrunklineHeader from "@/components/trunkline/TrunklineHeader";
import OverviewTab from "@/components/trunkline/dashboard/OverviewTab";
import ReturnTrackingTab from "@/components/trunkline/dashboard/ReturnTrackingTab";
import TrunklineOrdersTab from "@/components/trunkline/TrunklineOrdersTab";
import TrunklineCustomersTab from "@/components/trunkline/TrunklineCustomersTab";
import TrunklineSupportTab from "@/components/trunkline/TrunklineSupportTab";
import TrunklineAmazonTab from "@/components/trunkline/TrunklineAmazonTab";
import TrunklineZincTab from "@/components/trunkline/TrunklineZincTab";
import TrunklineZincDebuggerTab from "@/components/trunkline/TrunklineZincDebuggerTab";
import TrunklineVendorsTab from "@/components/trunkline/TrunklineVendorsTab";
import BusinessPaymentMethodManager from "@/components/settings/BusinessPaymentMethodManager";
import TrunklineAnalytics from "@/pages/trunkline/TrunklineAnalytics";
import TrunklineMonitoring from "@/pages/trunkline/TrunklineMonitoring";
import TrunklineScaling from "@/pages/trunkline/TrunklineScaling";

const Trunkline = () => {
  return (
    <ProductProvider>
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <TrunklineSidebar />
          <SidebarInset className="flex-1">
            <TrunklineHeader />
            <div className="p-6">
              <Routes>
                <Route path="/" element={<OverviewTab />} />
                <Route path="/orders" element={<TrunklineOrdersTab />} />
                <Route path="/customers" element={<TrunklineCustomersTab />} />
                <Route path="/support" element={<TrunklineSupportTab />} />
                <Route path="/returns" element={<ReturnTrackingTab />} />
                <Route path="/amazon" element={<TrunklineAmazonTab />} />
                <Route path="/business-payments" element={<BusinessPaymentMethodManager />} />
                <Route path="/zinc" element={<TrunklineZincTab />} />
                <Route path="/zinc-debugger" element={<TrunklineZincDebuggerTab />} />
                <Route path="/vendors" element={<TrunklineVendorsTab />} />
                <Route path="/analytics" element={<TrunklineAnalytics />} />
                <Route path="/monitoring" element={<TrunklineMonitoring />} />
                <Route path="/scaling" element={<TrunklineScaling />} />
              </Routes>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </ProductProvider>
  );
};

export default Trunkline;
