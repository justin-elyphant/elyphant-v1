import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";
import ProfileHeader from "@/components/user-profile/ProfileHeader";
import ProfileTabs from "@/components/user-profile/ProfileTabs";
import { Skeleton } from "@/components/ui/skeleton";

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  
  const [profileData, setProfileData] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [activeTab, setActiveTab] = useState("wishlists");
  const [localLoadingTimeout, setLocalLoadingTimeout] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setLocalLoadingTimeout(false);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const isCurrentUser = user?.id === userId;
  
  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) {
        setError("No user ID provided");
        setLoadingProfile(false);
        return;
      }
      
      try {
        console.log("Fetching profile data for:", userId);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        
        if (error) {
          console.error("Error fetching profile:", error);
          setError("Failed to load profile data");
          setLoadingProfile(false);
          return;
        }
        
        if (!data) {
          console.log("No profile found for user:", userId);
          setError("Profile not found");
          setLoadingProfile(false);
          return;
        }
        
        console.log("Profile data loaded:", data);
        setProfileData(data);
        setError(null);
      } catch (err) {
        console.error("Unexpected error fetching profile:", err);
        setError("An unexpected error occurred");
      } finally {
        setLoadingProfile(false);
      }
    };
    
    if (userId) {
      fetchProfile();
    }
  }, [userId]);
  
  const isPageLoading = (isLoading && localLoadingTimeout) || (loadingProfile && localLoadingTimeout);
  
  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container max-w-5xl mx-auto py-8 px-4">
          <Skeleton className="h-10 w-48 mb-6" />
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <Skeleton className="h-40 w-40 rounded-full" />
              <div className="flex-1 space-y-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-6 w-80" />
                <Skeleton className="h-24 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container max-w-5xl mx-auto py-8 px-4">
          <ProfileHeader profile={null} isCurrentUser={false} />
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <h2 className="text-xl font-medium text-red-600 mb-2">Error Loading Profile</h2>
            <p className="text-gray-500">{error}</p>
            <button
              onClick={() => navigate(-1)}
              className="mt-4 px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const mockWishlists = [
    // Add some mock data for wishlists if needed
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container max-w-5xl mx-auto py-8 px-4">
        <ProfileHeader profile={profileData} isCurrentUser={isCurrentUser} />
        
        {profileData && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                <div className="relative">
                  {profileData.profile_image ? (
                    <img 
                      src={profileData.profile_image} 
                      alt={profileData.name} 
                      className="h-40 w-40 object-cover rounded-full border-4 border-white shadow-md"
                    />
                  ) : (
                    <div className="h-40 w-40 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white text-4xl font-bold border-4 border-white shadow-md">
                      {profileData.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )}
                </div>
                
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-2xl font-bold">{profileData.name || 'Anonymous User'}</h1>
                  {profileData.username && (
                    <p className="text-gray-500">@{profileData.username}</p>
                  )}
                  <div className="mt-4">
                    <p className="text-gray-700">{profileData.bio || 'No bio available'}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <ProfileTabs
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              isCurrentUser={isCurrentUser}
              mockWishlists={mockWishlists}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
