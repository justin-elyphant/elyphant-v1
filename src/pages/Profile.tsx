import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";
import ProfileTabs from "@/components/user-profile/ProfileTabs";
import LoadingState from "./profile-setup/LoadingState";
import { Profile as ProfileType } from "@/types/profile";

const Profile = () => {
  const { user } = useAuth();
  const { username } = useParams();
  const [profileData, setProfileData] = useState<ProfileType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
      }

      if (data) {
        setProfileData(data);
        setIsCurrentUser(user?.id === data.id);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsLoading(false);
    }
  }, [username, user?.id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (data: Partial<ProfileType>) => {
    setIsLoading(true);
    try {
      const { data: updatedData, error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', profileData?.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating profile:", error);
      }

      if (updatedData) {
        setProfileData(updatedData);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (!profileData) {
    return <div>Profile not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-semibold mb-4">
          {profileData.name || profileData.username || "User Profile"}
        </h1>
        <ProfileTabs 
          profile={profileData}
          isOwnProfile={isCurrentUser} // Changed from isCurrentUser to isOwnProfile
          onUpdateProfile={updateProfile}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          // ... any other needed props
        />
      </div>
    </div>
  );
};

export default Profile;
