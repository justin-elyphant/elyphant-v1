
import React from "react";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/contexts/profile/ProfileContext";
import MyWishlists from "@/components/gifting/MyWishlists";
import { ProductProvider } from "@/contexts/ProductContext";
import { SidebarLayout } from "@/components/layout/SidebarLayout";

const Wishlists = () => {
  const { user } = useAuth();
  const { profile } = useProfile();

  // Get user's first name from profile, with fallbacks
  const getUserFirstName = () => {
    // Use profile first_name if available (cast to any due to outdated types)
    if ((profile as any)?.first_name?.trim()) {
      return (profile as any).first_name.trim();
    }
    
    // Fallback to auth metadata
    if (user?.user_metadata?.first_name?.trim()) {
      return user.user_metadata.first_name.trim();
    }
    
    // Fallback to extracting from full name
    if (user?.user_metadata?.name) {
      const firstName = user.user_metadata.name.split(' ')[0].trim();
      if (firstName) return firstName;
    }
    
    return "My";
  };

  const userName = getUserFirstName();
  const pageTitle = userName === "My" ? "My Wishlists" : `${userName}'s Wishlists`;

  return (
    <SidebarLayout>
      <ProductProvider>
        <div className="container mx-auto py-8 px-4">
          <h1 className="text-2xl font-bold mb-6 text-left">{pageTitle}</h1>
          <MyWishlists />
        </div>
      </ProductProvider>
    </SidebarLayout>
  );
};

export default Wishlists;
