
import React from "react";
import { useAuth } from "@/contexts/auth";
import ProfileHeader from "@/components/user-profile/ProfileHeader";
import ProfileTabs from "@/components/user-profile/ProfileTabs";

const Profile = () => {
  const { user } = useAuth();
  
  if (!user) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold mb-4">Profile Not Available</h1>
          <p>Please sign in to view your profile.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <ProfileHeader />
      <ProfileTabs />
    </div>
  );
};

export default Profile;
