
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";
import ProfileHeader from "@/components/user-profile/ProfileHeader";
import ProfileTabs from "@/components/user-profile/ProfileTabs";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/home/Header";

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  
  const [profileData, setProfileData] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [activeTab, setActiveTab] = useState("wishlists");
  const [localLoadingTimeout, setLocalLoadingTimeout] = useState(true);
  
  // Set up a timeout to prevent indefinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLocalLoadingTimeout(false);
    }, 2000); // Stop loading after 2 seconds max
    
    return () => clearTimeout(timer);
  }, []);
  
  // Check if viewing own profile
  const isCurrentUser = user?.id === userId;
  
  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;
      
      try {
        console.log("Fetching profile data for:", userId);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
          
        if (error) {
          console.error("Error fetching profile:", error);
          throw error;
        }
        
        console.log("Profile data retrieved:", data);
        setProfileData(data);
      } catch (error) {
        console.error("Error retrieving profile data:", error);
      } finally {
        setLoadingProfile(false);
      }
    };
    
    if (!isLoading) {
      fetchProfile();
    }
  }, [userId, isLoading]);
  
  // Handle loading states
  const isPageLoading = (isLoading && localLoadingTimeout) || loadingProfile;
  
  if (!isPageLoading && !user) {
    navigate("/sign-in", { replace: true });
    return null;
  }
  
  // Mock wishlists data
  const mockWishlists = isCurrentUser 
    ? [
        { 
          id: 1, 
          title: "Birthday Wishlist", 
          description: "Things I'd like for my birthday", 
          itemCount: 12,
          image: "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YmlydGhkYXl8ZW58MHx8MHx8fDA%3D"
        },
        { 
          id: 2, 
          title: "Home Office Upgrade", 
          description: "Stuff to improve my workspace", 
          itemCount: 8,
          image: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fGhvbWUlMjBvZmZpY2V8ZW58MHx8MHx8fDA%3D"
        }
      ]
    : [];
    
  // Show skeleton loading state
  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container max-w-4xl mx-auto py-8 px-4">
          <div className="rounded-lg overflow-hidden mb-6">
            <Skeleton className="h-48 w-full" />
            <div className="flex flex-col md:flex-row md:items-end mt-4 gap-4">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
          </div>
          
          <Skeleton className="h-10 w-full mb-6" />
          
          <div className="space-y-4">
            <Skeleton className="h-6 w-48 mb-2" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-64 w-full rounded-lg" />
              <Skeleton className="h-64 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Handle profile not found
  if (!profileData && !loadingProfile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container max-w-4xl mx-auto py-8 px-4 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Profile Not Found</h2>
          <p className="text-gray-600 mb-6">The profile you're looking for doesn't exist or has been removed.</p>
          <button 
            onClick={() => navigate(-1)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <ProfileHeader 
          profile={profileData} 
          isCurrentUser={isCurrentUser}
        />
        
        <div className="mt-8">
          <ProfileTabs 
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isCurrentUser={isCurrentUser}
            mockWishlists={mockWishlists}
          />
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
