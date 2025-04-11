
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { Loader } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth";

// Import components
import ProfileHeader from "@/components/user-profile/ProfileHeader";
import ProfileBanner from "@/components/user-profile/ProfileBanner";
import ProfileInfo from "@/components/user-profile/ProfileInfo";
import InterestsSection from "@/components/user-profile/InterestsSection";
import ImportantDatesSection from "@/components/user-profile/ImportantDatesSection";
import ProfileTabs from "@/components/user-profile/ProfileTabs";

const UserProfile = () => {
  const { userId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [profileData, setProfileData] = useState<any>(null);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("wishlists");
  
  // Mock wishlists data - to be replaced with real data from API
  const mockWishlists = [
    {
      id: '1',
      title: 'Birthday Wishlist',
      description: 'Things I would love for my upcoming birthday',
      itemCount: 7,
      image: 'https://images.unsplash.com/photo-1513151233558-d860c5398176'
    },
    {
      id: '2',
      title: 'Home Decor',
      description: 'Items for my new apartment',
      itemCount: 12,
      image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7'
    }
  ];
  
  // Fetch profile data from Supabase
  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) {
        toast.error("User ID is missing");
        navigate("/dashboard");
        return;
      }
      
      setIsLoading(true);
      
      try {
        // Fetch user profile data
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (error) throw error;
        
        if (!data) {
          toast.error("User not found");
          navigate("/dashboard");
          return;
        }
        
        // Check if this is the current user's profile
        setIsCurrentUser(user?.id === userId);
        
        // Format and set profile data
        setProfileData({
          id: data.id,
          name: data.name || "Unnamed User",
          email: data.email,
          username: data.username || data.email?.split('@')[0] || "username",
          bio: data.bio || "",
          profileImage: data.profile_image,
          birthday: data.dob,
          address: data.shipping_address,
          interests: Array.isArray(data.gift_preferences) 
            ? data.gift_preferences.map((pref: any) => 
                typeof pref === 'string' ? pref : pref.category
              ).filter(Boolean) 
            : [],
          importantDates: data.important_dates || [],
          data_sharing_settings: data.data_sharing_settings || {
            dob: "private",
            shipping_address: "private",
            gift_preferences: "friends"
          }
        });
        
        // Fetch important dates if available
        if (data.id) {
          const { data: datesData, error: datesError } = await supabase
            .from('user_special_dates')
            .select('*')
            .eq('user_id', data.id);
          
          if (!datesError && datesData) {
            setProfileData(prev => ({
              ...prev,
              importantDates: datesData.map((date: any) => ({
                date: date.date,
                description: date.date_type
              }))
            }));
          }
        }
        
        // Check if current user is following this profile
        if (user && userId !== user.id) {
          const { data: connectionData } = await supabase
            .from('user_connections')
            .select('*')
            .eq('user_id', user.id)
            .eq('connected_user_id', userId)
            .eq('status', 'accepted')
            .single();
          
          setIsFollowing(!!connectionData);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        toast.error("Failed to load user profile");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfile();
  }, [userId, user, navigate]);
  
  const handleFollow = async () => {
    if (!user) {
      toast.error("You must be logged in to follow users");
      navigate("/sign-in");
      return;
    }
    
    try {
      if (isFollowing) {
        // Unfollow logic
        const { error } = await supabase
          .from('user_connections')
          .delete()
          .eq('user_id', user.id)
          .eq('connected_user_id', userId);
        
        if (error) throw error;
        
        setIsFollowing(false);
        toast.success("User unfollowed");
      } else {
        // Follow logic
        const { error } = await supabase
          .from('user_connections')
          .insert({
            user_id: user.id,
            connected_user_id: userId,
            relationship_type: 'friend',
            status: 'pending'
          });
        
        if (error) throw error;
        
        setIsFollowing(true);
        toast.success("Follow request sent");
      }
    } catch (err) {
      console.error("Error updating follow status:", err);
      toast.error("Failed to update follow status");
    }
  };
  
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Profile link copied to clipboard");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading profile...</span>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <ProfileHeader />
      
      <ProfileBanner 
        userData={profileData}
        isCurrentUser={isCurrentUser}
        isFollowing={isFollowing}
        onFollow={handleFollow}
        onShare={handleShare}
      />
      
      <ProfileInfo userData={profileData} />
      
      <InterestsSection interests={profileData?.interests || []} />
      
      <ImportantDatesSection importantDates={profileData?.importantDates || []} />
      
      <Separator className="my-6" />
      
      <ProfileTabs 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCurrentUser={isCurrentUser}
        mockWishlists={mockWishlists}
      />
    </div>
  );
};

export default UserProfile;
