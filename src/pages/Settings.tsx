
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import SettingsLayout from "@/components/settings/SettingsLayout";
import GeneralSettings from "@/components/settings/GeneralSettings";
import NotificationSettings from "@/components/settings/NotificationSettings";
import PaymentSettings from "@/components/settings/PaymentSettings";
import { useAuth } from "@/contexts/auth";
import { Skeleton } from "@/components/ui/skeleton";

const Settings = () => {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  
  const [activeTab, setActiveTab] = useState(tabParam || "general");
  const [localLoading, setLocalLoading] = useState(true);
  
  // Set up a timeout to prevent indefinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLocalLoading(false);
    }, 2000); // Stop loading after 2 seconds max
    
    return () => clearTimeout(timer);
  }, []);
  
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
  
  // Determine if we should still be showing loading state
  const showLoading = isLoading && localLoading;
  
  // If loading has timed out or auth check is complete and user is not logged in
  if (!showLoading && !user) {
    navigate("/signin", { replace: true });
    return null;
  }
  
  if (showLoading) {
    return (
      <MainLayout>
        <div className="container max-w-5xl mx-auto py-8 px-4">
          <div className="mb-6">
            <Skeleton className="h-9 w-40" />
          </div>
          
          <Skeleton className="h-10 w-full max-w-md mb-6" />
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <Skeleton className="h-8 w-48 mb-6" />
            <Skeleton className="h-12 w-full mb-4" />
            <Skeleton className="h-12 w-full mb-4" />
            <Skeleton className="h-12 w-full mb-4" />
            <Skeleton className="h-12 w-full mb-4" />
          </div>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <SettingsLayout 
        tabs={tabs} 
        activeTab={activeTab} 
        onTabChange={handleTabChange}
      >
        {activeTab === "general" && <GeneralSettings />}
        {activeTab === "notification" && <NotificationSettings />}
        {activeTab === "payment" && <PaymentSettings />}
      </SettingsLayout>
    </div>
  );
};

export default Settings;
