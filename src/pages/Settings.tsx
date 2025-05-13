
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/contexts/profile/ProfileContext";
import SettingsLayout from "@/components/settings/SettingsLayout";
import GeneralSettings from "@/components/settings/GeneralSettings";
import NotificationSettings from "@/components/settings/NotificationSettings";
import PrivacySettings from "@/components/connections/PrivacySettings";
import { Loader2 } from "lucide-react";

type SettingsTab = "general" | "notifications" | "privacy";

const Settings = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
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
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const tabs = [
    { id: "general", label: "General" },
    { id: "notifications", label: "Notifications" },
    { id: "privacy", label: "Privacy & Security" },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "general":
        return <GeneralSettings />;
      case "notifications":
        return <NotificationSettings />;
      case "privacy":
        return <PrivacySettings />;
      default:
        return <GeneralSettings />;
    }
  };

  return (
    <SettingsLayout
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={(tab) => setActiveTab(tab as SettingsTab)}
    >
      {renderTabContent()}
    </SettingsLayout>
  );
};

export default Settings;
