
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import SettingsLayout from "@/components/settings/SettingsLayout";
import GeneralSettings from "@/components/settings/GeneralSettings";
import NotificationSettings from "@/components/settings/NotificationSettings";
import PaymentSettings from "@/components/settings/PaymentSettings";
import { useAuth } from "@/contexts/auth";

const Settings = () => {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState(tabParam || "general");
  
  // If not logged in, redirect to login
  useEffect(() => {
    if (!user) {
      navigate("/sign-in");
    }
  }, [user, navigate]);
  
  // When tab changes in URL, update active tab
  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);
  
  // Update URL when active tab changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    navigate(`/settings?tab=${tab}`);
  };
  
  const tabs = [
    { id: "general", label: "General Settings" },
    { id: "notification", label: "Notifications" },
    { id: "payment", label: "Payment Methods" },
  ];
  
  return (
    <SettingsLayout 
      tabs={tabs} 
      activeTab={activeTab} 
      onTabChange={handleTabChange}
    >
      {activeTab === "general" && <GeneralSettings />}
      {activeTab === "notification" && <NotificationSettings />}
      {activeTab === "payment" && <PaymentSettings />}
    </SettingsLayout>
  );
};

export default Settings;
