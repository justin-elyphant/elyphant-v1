
import React, { useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/contexts/profile/ProfileContext";
import MainLayout from "@/components/layout/MainLayout";
import UnifiedSettings from "@/components/settings/UnifiedSettings";
import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

type SettingsTab = "profile" | "notifications" | "privacy" | "gifting";

const Settings = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { profile, loading } = useProfile();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Get initial tab from URL params or location state
  const getInitialTab = (): SettingsTab => {
    const urlTab = searchParams.get('tab') as SettingsTab;
    const stateTab = location.state?.activeTab as SettingsTab;
    return stateTab || urlTab || "profile";
  };

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

  return (
    <MainLayout>
      <div className="container max-w-4xl mx-auto py-8 px-4">
        {/* Quick Links */}
        <div className="mb-6">
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

        {/* Unified Settings */}
        <UnifiedSettings initialTab={getInitialTab()} />
      </div>
    </MainLayout>
  );
};

export default Settings;
