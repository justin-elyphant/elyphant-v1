import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { useLocalStorage } from "@/components/gifting/hooks/useLocalStorage";

// Import the component files
import ProfileHeader from "@/components/user-profile/ProfileHeader";
import ProfileBanner from "@/components/user-profile/ProfileBanner";
import ProfileInfo from "@/components/user-profile/ProfileInfo";
import InterestsSection from "@/components/user-profile/InterestsSection";
import ImportantDatesSection from "@/components/user-profile/ImportantDatesSection";
import ProfileTabs from "@/components/user-profile/ProfileTabs";

// Mock wishlist data - in a real app, this would come from a database
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
  },
  {
    id: '3',
    title: 'Tech Gadgets',
    description: 'Cool tech I want to try',
    itemCount: 5,
    image: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147'
  }
];

const UserProfile = () => {
  const { userId } = useParams();
  const [userData, setUserData] = useLocalStorage("userData", null);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState("wishlists");
  
  // In a real app, this would fetch the profile data from an API
  useEffect(() => {
    // Check if viewing own profile
    if (userData && userData.id === userId) {
      setIsCurrentUser(true);
    }
    
    // This is just for the mock data - in a real app, check if user is following
    setIsFollowing(Math.random() > 0.5);
  }, [userId, userData]);
  
  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    // In a real app, this would update the database
  };
  
  const handleShare = () => {
    // Mock share functionality
    navigator.clipboard.writeText(window.location.href);
    alert("Profile link copied to clipboard!");
  };

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <ProfileHeader />
      
      <ProfileBanner 
        userData={userData}
        isCurrentUser={isCurrentUser}
        isFollowing={isFollowing}
        onFollow={handleFollow}
        onShare={handleShare}
      />
      
      <ProfileInfo userData={userData} />
      
      <InterestsSection interests={userData?.interests || []} />
      
      <ImportantDatesSection importantDates={userData?.importantDates || []} />
      
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
