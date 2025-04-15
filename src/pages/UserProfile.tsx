
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";
import MainLayout from "@/components/layout/MainLayout";
import ProfileHeader from "@/components/user-profile/ProfileHeader";
import ProfileBanner from "@/components/user-profile/ProfileBanner";
import ProfileInfo from "@/components/user-profile/ProfileInfo";
import ProfileTabs from "@/components/user-profile/ProfileTabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  
  const [profileData, setProfileData] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [activeTab, setActiveTab] = useState("wishlists");
  const [localLoadingTimeout, setLocalLoadingTimeout] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  
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
  
  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    toast.success(isFollowing ? "Unfollowed user" : "Now following user");
  };
  
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Profile link copied to clipboard");
  };
  
  const isPageLoading = (isLoading && localLoadingTimeout) || (loadingProfile && localLoadingTimeout);
  
  if (isPageLoading) {
    return (
      <MainLayout>
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
      </MainLayout>
    );
  }
  
  if (error) {
    return (
      <MainLayout>
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
      </MainLayout>
    );
  }

  // Use the profile data to generate mock wishlists if needed
  const mockWishlists = [
    {
      id: 1,
      title: "Birthday Wishlist",
      items: (profileData?.gift_preferences || []).slice(0, 3).map((pref, index) => ({
        id: index,
        name: typeof pref === 'string' ? pref : pref.category,
        image: `/placeholders/gift-${index + 1}.jpg`
      }))
    }
  ];

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="container max-w-5xl mx-auto py-8 px-4">
          <ProfileHeader profile={profileData} isCurrentUser={isCurrentUser} />
          
          {profileData && (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <ProfileBanner 
                userData={profileData}
                isCurrentUser={isCurrentUser}
                isFollowing={isFollowing}
                onFollow={handleFollow}
                onShare={handleShare}
              />
              
              <ProfileInfo userData={profileData} />
              
              <ProfileTabs
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isCurrentUser={isCurrentUser}
                mockWishlists={mockWishlists}
                userData={profileData}
              />
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default UserProfile;
