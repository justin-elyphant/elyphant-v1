
import React from "react";
import { useAuth } from "@/contexts/auth";
import BackToDashboard from "@/components/shared/BackToDashboard";
import MyWishlists from "@/components/gifting/MyWishlists";
import MainLayout from "@/components/layout/MainLayout";
import { ProductProvider } from "@/contexts/ProductContext";

const Wishlists = () => {
  const { user } = useAuth();

  // Extract user's name with fallback logic
  const getUserName = () => {
    if (!user) return "My";
    
    // Try user metadata name fields
    if (user.user_metadata?.name) return user.user_metadata.name;
    if (user.user_metadata?.full_name) return user.user_metadata.full_name;
    
    // Try to extract from email
    if (user.email) {
      const emailName = user.email.split('@')[0];
      // Capitalize first letter and replace dots/underscores with spaces
      return emailName
        .replace(/[._]/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    
    return "My";
  };

  const userName = getUserName();
  const pageTitle = userName === "My" ? "My Wishlists" : `${userName}'s Wishlists`;

  return (
    <MainLayout>
      <ProductProvider>
        <div className="container mx-auto py-8 px-4">
          <BackToDashboard />
          <h1 className="text-2xl font-bold mb-6">{pageTitle}</h1>
          <MyWishlists />
        </div>
      </ProductProvider>
    </MainLayout>
  );
};

export default Wishlists;
