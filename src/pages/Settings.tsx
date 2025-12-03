import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { supabase } from "@/integrations/supabase/client";
import SettingsLayout from "@/components/settings/SettingsLayout";
import MyInfoSettings from "@/components/settings/MyInfoSettings";
import MyAddressSettings from "@/components/settings/MyAddressSettings";
import MySizesSettings from "@/components/settings/MySizesSettings";
import MyEventsSettings from "@/components/settings/MyEventsSettings";
import MyInterestsSettings from "@/components/settings/MyInterestsSettings";
import MyGiftingSettings from "@/components/settings/MyGiftingSettings";
import NotificationSettings from "@/components/settings/NotificationSettings";
import PrivacySharingSettings from "@/components/settings/PrivacySharingSettings";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarLayout } from "@/components/layout/SidebarLayout";

type SettingsTab = "info" | "address" | "sizes" | "events" | "interests" | "gifting" | "notifications" | "privacy" | "";

const Settings = () => {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as SettingsTab;
  const sectionParam = searchParams.get('section'); // Legacy support
  
  // Map legacy section parameters to current tab names
  const mapSectionToTab = (section: string | null): SettingsTab | null => {
    switch (section) {
      case 'profile': return 'info';
      case 'basic': return 'info';
      case 'general': return 'info';
      case 'address': return 'address';
      case 'sizes': return 'sizes';
      case 'dates': return 'events';
      case 'events': return 'events';
      case 'interests': return 'interests';
      case 'gifting': return 'gifting';
      case 'notifications': return 'notifications';  
      case 'privacy': return 'privacy';
      case 'billing': return 'info';
      default: return null;
    }
  };
  
  // Empty string means show card navigation
  const initialTab = tabParam || mapSectionToTab(sectionParam) || "";
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const { profile, loading, error, refetchProfile } = useProfile();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [forceRefreshCount, setForceRefreshCount] = useState(0);

  // Force profile refresh when navigating to settings
  useEffect(() => {
    const forceRefreshProfileOnNavigation = async () => {
      if (user) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            console.log("🔐 Settings: Auth session validated");
          }
        } catch (error) {
          console.error("❌ Error validating auth session:", error);
        }
        
        if (refetchProfile) {
          try {
            await refetchProfile();
            setForceRefreshCount(prev => prev + 1);
          } catch (error) {
            console.error("❌ Error force refreshing profile:", error);
          }
        }
      }
    };

    forceRefreshProfileOnNavigation();
  }, [user, refetchProfile]);

  // Redirect if not logged in
  useEffect(() => {
    if (!user && !loading) {
      toast.error("You must be logged in to access settings");
      navigate("/signin");
    }
  }, [user, loading, navigate]);

  // Detect stuck state
  useEffect(() => {
    if (user && !loading && !profile && !error) {
      console.error("⚠️ Stuck state detected: User authenticated but profile is null");
      toast.error("Your profile could not be found. Please sign in again.");
      supabase.auth.signOut().then(() => {
        navigate("/");
      });
    }
  }, [user, loading, profile, error, navigate]);

  // Add timeout for loading state
  useEffect(() => {
    if (loading && !hasTimedOut) {
      const timeout = setTimeout(() => {
        console.warn("Settings page loading timeout reached");
        setHasTimedOut(true);
      }, 10000);

      return () => clearTimeout(timeout);
    }
  }, [loading, hasTimedOut]);

  // Show error state
  if (!profile && (error || hasTimedOut)) {
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
    { id: "info", label: "My Info" },
    { id: "address", label: "My Address" },
    { id: "sizes", label: "My Sizes" },
    { id: "events", label: "My Events" },
    { id: "interests", label: "My Interests" },
    { id: "gifting", label: "My Gifting" },
    { id: "notifications", label: "My Notifications" },
    { id: "privacy", label: "Privacy & Sharing" },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "info":
        return <MyInfoSettings key={`info-${forceRefreshCount}`} />;
      case "address":
        return <MyAddressSettings key={`address-${forceRefreshCount}`} />;
      case "sizes":
        return <MySizesSettings />;
      case "events":
        return <MyEventsSettings key={`events-${forceRefreshCount}`} />;
      case "interests":
        return <MyInterestsSettings key={`interests-${forceRefreshCount}`} />;
      case "gifting":
        return <MyGiftingSettings key={`gifting-${forceRefreshCount}`} />;
      case "notifications":
        return <NotificationSettings />;
      case "privacy":
        return <PrivacySharingSettings />;
      case "":
        return null; // Card navigation shown by SettingsLayout
      default:
        return null;
    }
  };

  return (
    <SidebarLayout>
      <SettingsLayout
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
      >
        {renderTabContent()}
      </SettingsLayout>
    </SidebarLayout>
  );
};

export default Settings;
