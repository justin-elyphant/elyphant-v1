
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardGrid from "@/components/dashboard/DashboardGrid";
import { useAuth } from "@/contexts/auth";
import { useUnifiedProfile } from "@/hooks/useUnifiedProfile";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarLayout } from "@/components/layout/SidebarLayout";

const Dashboard = () => {
  const { user, signOut, isLoading } = useAuth();
  const { profile } = useUnifiedProfile();
  const navigate = useNavigate();
  const [profileLoading, setProfileLoading] = useState(true);
  const [localLoadingTimeout, setLocalLoadingTimeout] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLocalLoadingTimeout(false);
      setProfileLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);
  
  useEffect(() => {
    console.log('Dashboard.tsx Effect: user, isLoading, localLoadingTimeout', { user, isLoading, localLoadingTimeout });
    if (!user && !isLoading && !localLoadingTimeout) {
      console.log("No user in Dashboard, redirecting to sign-in (after timeout/loading)");
      navigate("/signin", { replace: true });
    } else if (!isLoading && user) {
      setProfileLoading(false);
    }
  }, [user, navigate, isLoading, localLoadingTimeout]);

  // If still loading or waiting for timeout, show skeleton
  if (isLoading || localLoadingTimeout || profileLoading) {
    return (
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // At this point, loading/timeouts are resolved. If still no user, let useEffect redirect.
  if (!user && !isLoading && !localLoadingTimeout) return null;

  // Get first name from auth metadata or profile
  const firstName = user?.user_metadata?.first_name;

  return (
    <SidebarLayout>
      <div className="container max-w-6xl mx-auto py-4 sm:py-8 px-3 sm:px-4">
        {/* Welcome Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Welcome {firstName ? `${firstName} ` : ''}to Elyphant
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Explore your dashboard to connect with friends, schedule gifts, or build your wishlists to share
          </p>
        </div>
        
        <DashboardGrid />
      </div>
    </SidebarLayout>
  );
};

export default Dashboard;
