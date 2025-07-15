
import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/contexts/profile/ProfileContext";
import MainLayout from "@/components/layout/MainLayout";
import SettingsLayout from "@/components/settings/SettingsLayout";
import GeneralSettings from "@/components/settings/GeneralSettings";
import NotificationSettings from "@/components/settings/NotificationSettings";
import PrivacySecuritySettings from "@/components/settings/PrivacySecuritySettings";
import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

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
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
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
    <MainLayout>
      <SettingsLayout
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as SettingsTab)}
      >
        {user && (
          <div className="mb-6">
            <h2 className="font-semibold text-lg mb-3">Your Quick Links</h2>
            <div className="flex flex-wrap gap-3 mb-4">
              <Link
                to="/dashboard"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium text-sm shadow-sm transition"
              >
                Dashboard
              </Link>
              <Link
                to={`/profile/${user.id}`}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium text-sm shadow-sm transition"
              >
                Profile
              </Link>
              <Link
                to="/connections"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium text-sm shadow-sm transition"
              >
                Connections
              </Link>
              <Link
                to="/wishlists"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium text-sm shadow-sm transition"
              >
                Wishlists
              </Link>
            </div>
          </div>
        )}
        {renderTabContent()}
      </SettingsLayout>
    </MainLayout>
  );
};

export default Settings;
