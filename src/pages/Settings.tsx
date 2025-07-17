
import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import SettingsLayout from "@/components/settings/SettingsLayout";
import GeneralSettings from "@/components/settings/GeneralSettings";
import NotificationSettings from "@/components/settings/NotificationSettings";
import PrivacySecuritySettings from "@/components/settings/PrivacySecuritySettings";
import { Loader2 } from "lucide-react";


type SettingsTab = "general" | "notifications" | "privacy";

const Settings = () => {
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as SettingsTab) || "general";
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const { profile, loading } = useProfile();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect if not logged in
  React.useEffect(() => {
    if (!user && !loading) {
      toast.error("You must be logged in to access settings");
      navigate("/signin");
    }
  }, [user, loading, navigate]);

  if (loading || !profile) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </SidebarLayout>
    );
  }

  const tabs = [
    { id: "general", label: "My Profile" },
    { id: "notifications", label: "My Notifications" },
    { id: "privacy", label: "My Privacy & Security" },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "general":
        return <GeneralSettings />;
      case "notifications":
        return <NotificationSettings />;
      case "privacy":
        return <PrivacySecuritySettings />;
      default:
        return <GeneralSettings />;
    }
  };

  return (
    <SidebarLayout>
      <SettingsLayout
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as SettingsTab)}
      >
        {renderTabContent()}
      </SettingsLayout>
    </SidebarLayout>
  );
};

export default Settings;
