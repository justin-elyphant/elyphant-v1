
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardGrid from "@/components/dashboard/DashboardGrid";
import { useAuth } from "@/contexts/auth";
import { useProfileCompletion } from "@/hooks/profile/useProfileCompletion";
import Hero from "@/components/home/Hero";
import SearchBar from "@/components/home/components/SearchBar";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isComplete, loading } = useProfileCompletion(true); // Set to true to enable redirects
  
  // Redirect to sign-in if not logged in
  useEffect(() => {
    if (!user) {
      navigate("/sign-in");
    }
  }, [user, navigate]);

  if (!user) {
    return null; // Don't render anything while redirecting
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // The redirect to /profile-setup is handled by the useProfileCompletion hook if profile is incomplete
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Add Hero banner */}
      <Hero />
      
      <div className="container max-w-6xl mx-auto py-8 px-4">
        {/* Add search bar */}
        <div className="mb-6 max-w-3xl mx-auto">
          <SearchBar />
        </div>
        
        <DashboardHeader userData={user} onLogout={() => {}} />
        <DashboardGrid />
      </div>
    </div>
  );
};

export default Dashboard;
