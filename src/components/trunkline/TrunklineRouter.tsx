import React from "react";
import { useLocation } from "react-router-dom";
import OverviewTab from "@/components/trunkline/dashboard/OverviewTab";
import ReturnTrackingTab from "@/components/trunkline/dashboard/ReturnTrackingTab";
import TrunklineOrdersTab from "@/components/trunkline/TrunklineOrdersTab";
import TrunklineCustomersTab from "@/components/trunkline/TrunklineCustomersTab";
import TrunklineSupportTab from "@/components/trunkline/TrunklineSupportTab";
import TrunklineAmazonTab from "@/components/trunkline/TrunklineAmazonTab";
import TrunklineZincTab from "@/components/trunkline/TrunklineZincTab";
import OrderOperationsTools from "@/components/trunkline/OrderOperationsTools";
import TrunklineVendorsTab from "@/components/trunkline/TrunklineVendorsTab";
import BusinessPaymentMethodManager from "@/components/settings/BusinessPaymentMethodManager";
import TrunklineAnalytics from "@/pages/trunkline/TrunklineAnalytics";
import TrunklineMonitoring from "@/pages/trunkline/TrunklineMonitoring";
import TrunklineScaling from "@/pages/trunkline/TrunklineScaling";
import ProductionHardeningCenter from "@/pages/trunkline/ProductionHardeningCenter";
import EmailTemplatesManager from "@/components/trunkline/communications/EmailTemplatesManager";
import EmailAnalyticsDashboard from "@/components/trunkline/communications/EmailAnalyticsDashboard";
import EmailOrchestratorTester from "@/pages/trunkline/EmailOrchestratorTester";

export const TrunklineRouter: React.FC = () => {
  const location = useLocation();
  const path = location.pathname.replace('/trunkline', '') || '/';

  const renderContent = () => {
    switch (path) {
      case '/':
        return <OverviewTab />;
      case '/orders':
        return <TrunklineOrdersTab />;
      case '/customers':
        return <TrunklineCustomersTab />;
      case '/support':
        return <TrunklineSupportTab />;
      case '/returns':
        return <ReturnTrackingTab />;
      case '/amazon':
        return <TrunklineAmazonTab />;
      case '/business-payments':
        return <BusinessPaymentMethodManager />;
      case '/zinc':
        return <TrunklineZincTab />;
      case '/zinc-debugger':
        return <OrderOperationsTools />;
      case '/vendors':
        return <TrunklineVendorsTab />;
      case '/analytics':
        return <TrunklineAnalytics />;
      case '/monitoring':
        return <TrunklineMonitoring />;
      case '/scaling':
        return <TrunklineScaling />;
      case '/production-hardening':
        return <ProductionHardeningCenter />;
      case '/communications/email-templates':
        return <EmailTemplatesManager />;
      case '/communications/email-analytics':
        return <EmailAnalyticsDashboard />;
      case '/communications/orchestrator-test':
        return <EmailOrchestratorTester />;
      default:
        return <OverviewTab />;
    }
  };

  return <>{renderContent()}</>;
};