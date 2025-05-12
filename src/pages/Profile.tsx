
import React, { useState } from "react";
import { useAuth } from "@/contexts/auth";
import ProfileHeader from "@/components/user-profile/ProfileHeader";
import ProfileTabs from "@/components/user-profile/ProfileTabs";

const Profile = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("wishlists");
  
  // Mock profile data for the ProfileHeader component
  const profile = {
    id: user?.id || "guest",
    username: user?.email?.split('@')[0] || "Guest User",
    email: user?.email || "",
    avatar_url: user?.user_metadata?.avatar_url || "",
    bio: "Welcome to my profile",
    interests: ["Gifts", "Tech", "Books"],
    created_at: new Date().toISOString()
  };
  
  // Mock wishlist data for the ProfileTabs component
  const mockWishlists = [
    {
      id: "1",
      title: "Birthday Wishlist",
      description: "Things I want for my birthday",
      created_at: new Date().toISOString(),
      is_public: true,
      items_count: 5
    },
    {
      id: "2",
      title: "Holiday Wishlist",
      description: "Gift ideas for the holidays",
      created_at: new Date().toISOString(),
      is_public: true,
      items_count: 3
    }
  ];
  
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
      <ProfileHeader 
        profile={profile}
        isCurrentUser={true}
      />
      <ProfileTabs 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCurrentUser={true}
        mockWishlists={mockWishlists}
      />
    </div>
  );
};

export default Profile;
