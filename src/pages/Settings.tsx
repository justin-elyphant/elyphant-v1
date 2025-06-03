
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/contexts/profile/ProfileContext";
import SettingsLayout from "@/components/settings/SettingsLayout";
import GeneralSettings from "@/components/settings/GeneralSettings";
import NotificationSettings from "@/components/settings/NotificationSettings";
import PrivacySecuritySettings from "@/components/settings/PrivacySecuritySettings";
import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

type SettingsTab = "general" | "notifications" | "privacy";

const Settings = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const { profile, loading } = useProfile();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hasRedirected, setHasRedirected] = useState(false);

  // Redirect if not logged in - but only once to prevent loops
  React.useEffect(() => {
    if (!user && !loading && !hasRedirected) {
      console.log("No user found, redirecting to signin");
      setHasRedirected(true);
      toast.error("You must be logged in to access settings");
      navigate("/signin", { replace: true });
    }
  }, [user, loading, navigate, hasRedirected]);

  // Show loading only if we're actually loading and have a user
  if (loading && user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Don't render anything if no user (will redirect)
  if (!user) {
    return null;
  }

  const tabs = [
    { id: "general", label: "General" },
    { id: "notifications", label: "Notifications" },
    { id: "privacy", label: "Privacy & Security" },
  ];

  const renderTabContent = () => {
    try {
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
    } catch (error) {
      console.error("Error rendering tab content:", error);
      return (
        <div className="text-center p-4">
          <p className="text-red-500">Error loading settings. Please try refreshing the page.</p>
        </div>
      );
    }
  };

  return (
    <SettingsLayout
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={(tab) => setActiveTab(tab as SettingsTab)}
    >
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
      {renderTabContent()}
    </SettingsLayout>
  );
};

export default Settings;
