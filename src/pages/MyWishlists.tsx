
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import MyWishlists from "@/components/gifting/MyWishlists";
import BackToDashboard from "@/components/shared/BackToDashboard";

const MyWishlistsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!user) {
      navigate("/sign-in");
    }
  }, [user, navigate]);

  // Extract user's first name with fallback logic
  const getUserFirstName = () => {
    if (!user) return "My";
    
    // Try user metadata name fields - extract first name only
    if (user.user_metadata?.name) {
      const firstName = user.user_metadata.name.split(' ')[0].trim();
      return firstName || "My";
    }
    if (user.user_metadata?.full_name) {
      const firstName = user.user_metadata.full_name.split(' ')[0].trim();
      return firstName || "My";
    }
    
    // Try to extract from email - get first name only
    if (user.email) {
      const emailName = user.email.split('@')[0];
      // Capitalize first letter and replace dots/underscores with spaces
      const processedName = emailName
        .replace(/[._]/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      // Extract just the first name from the processed email
      const firstName = processedName.split(' ')[0].trim();
      return firstName || "My";
    }
    
    return "My";
  };

  if (!user) {
    return null;
  }

  const userName = getUserFirstName();
  const pageTitle = userName === "My" ? "My Wishlists" : `${userName}'s Wishlists`;

  return (
    <SidebarLayout>
      <div className="container mx-auto py-8 px-4">
        <BackToDashboard />
        <h1 className="text-2xl font-bold mb-6 text-left">{pageTitle}</h1>
        <MyWishlists />
      </div>
    </SidebarLayout>
  );
};

export default MyWishlistsPage;
