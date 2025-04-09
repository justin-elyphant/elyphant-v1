
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardGrid from "@/components/dashboard/DashboardGrid";
import { useAuth } from "@/contexts/auth";
import { useProfileCompletion } from "@/hooks/profile/useProfileCompletion";
import Hero from "@/components/home/Hero";
import SearchBar from "@/components/home/components/SearchBar";
import Logo from "@/components/home/components/Logo";

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
      <div className="bg-gradient-to-r from-purple-100 to-purple-200 py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <Logo />
            <div className="hidden md:block w-1/2 max-w-md">
              <SearchBar />
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-6 md:mb-0">
              <h2 className="text-3xl font-bold mb-3">Connecting Through Gifting</h2>
              <p className="text-base text-gray-700 mb-4">
                Create wishlists, automate gift-giving, and never miss 
                an important celebration again. Our platform handles everything from selection to delivery.
              </p>
            </div>
            <div className="md:w-1/2 flex justify-end">
              <div className="relative">
                <img 
                  src="https://images.unsplash.com/photo-1513885535751-8b9238bd345a" 
                  alt="Person opening a gift" 
                  className="rounded-lg shadow-lg max-w-full h-auto max-h-[220px] object-cover"
                />
                <div className="absolute bottom-4 right-4 bg-white bg-opacity-80 rounded-lg px-3 py-2 text-sm font-medium text-purple-800 shadow-sm">
                  Personalized Gift Experiences
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container max-w-6xl mx-auto py-8 px-4">
        {/* Add search bar for mobile */}
        <div className="md:hidden mb-6 max-w-3xl mx-auto">
          <SearchBar />
        </div>
        
        <DashboardHeader userData={user} onLogout={() => {}} />
        <DashboardGrid />
      </div>
    </div>
  );
};

export default Dashboard;
