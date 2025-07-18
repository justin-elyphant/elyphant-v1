
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/contexts/profile/ProfileContext";
import SettingsLayout from "@/components/settings/SettingsLayout";
import GeneralSettings from "@/components/settings/GeneralSettings";
import NotificationSettings from "@/components/settings/NotificationSettings";
import PrivacySecuritySettings from "@/components/settings/PrivacySecuritySettings";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";


type SettingsTab = "general" | "notifications" | "privacy";

const Settings = () => {
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as SettingsTab) || "general";
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const { profile, loading, error, refetchProfile } = useProfile();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hasTimedOut, setHasTimedOut] = useState(false);

  console.log("Settings page - loading:", loading, "profile:", profile, "user:", user, "error:", error);

  // Redirect if not logged in
  useEffect(() => {
    if (!user && !loading) {
      toast.error("You must be logged in to access settings");
      navigate("/signin");
    }
  }, [user, loading, navigate]);

  // Add timeout for loading state
  useEffect(() => {
    if (loading && !hasTimedOut) {
      const timeout = setTimeout(() => {
        console.warn("Settings page loading timeout reached");
        setHasTimedOut(true);
      }, 10000); // 10 second timeout

      return () => clearTimeout(timeout);
    }
  }, [loading, hasTimedOut]);

  // Show error state if there's an error or timeout
  if (error || hasTimedOut) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Unable to Load Settings</h2>
          <p className="text-muted-foreground mb-4">
            {error ? "There was an error loading your profile data." : "Loading timed out."}
          </p>
          <Button onClick={() => {
            setHasTimedOut(false);
            refetchProfile?.();
          }}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading your settings...</p>
      </div>
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
