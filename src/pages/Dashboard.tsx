
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardGrid from "@/components/dashboard/DashboardGrid";
import { useAuth } from "@/contexts/auth";
import { useProfileCompletion } from "@/hooks/profile/useProfileCompletion";
import Header from "@/components/home/Header";
import { Skeleton } from "@/components/ui/skeleton";

const Dashboard = () => {
  const { user, signOut, isLoading } = useAuth();
  const navigate = useNavigate();
  const { isComplete, loading: profileLoading } = useProfileCompletion(true); // Set to true to enable redirects
  const [localLoadingTimeout, setLocalLoadingTimeout] = useState(true);
  
  // Set up a timeout to prevent indefinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLocalLoadingTimeout(false);
    }, 2000); // Stop loading after 2 seconds max
    
    return () => clearTimeout(timer);
  }, []);
  
  // Redirect to sign-in if not logged in and not loading
  useEffect(() => {
    if (!isLoading && !user) {
      console.log("No user in Dashboard, redirecting to sign-in");
      navigate("/sign-in", { replace: true });
    }
  }, [user, navigate, isLoading]);

  // Determine if we should show loading state
  const isPageLoading = (isLoading && localLoadingTimeout) || (profileLoading && localLoadingTimeout);
  
  // Show loading skeleton while checking auth/profile status
  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
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
      </div>
    );
  }

  // If not loading and no user, redirect handled by useEffect
  if (!user) return null;
  
  // The redirect to /profile-setup is handled by the useProfileCompletion hook if profile is incomplete
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Add homepage header instead of Hero banner */}
      <Header />
      
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <DashboardHeader userData={user} onLogout={signOut} />
        <DashboardGrid />
      </div>
    </div>
  );
};

export default Dashboard;
