
import React, { useState } from "react";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/contexts/profile/ProfileContext";
import MyWishlists from "@/components/gifting/MyWishlists";
import CollectionsTab from "@/components/gifting/wishlists/CollectionsTab";
import { ProductProvider } from "@/contexts/ProductContext";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import "@/styles/mobile-wishlist.css";

const Wishlists = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [activeTab, setActiveTab] = useState("wishlists");

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

  // Detect mobile screen size for conditional layout
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Mobile layout without sidebar
  if (isMobile) {
    return (
      <ProductProvider>
        <div className="min-h-screen bg-background">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            {/* Mobile tab navigation */}
            <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50">
              <div className="safe-area-top" />
              <div className="px-4 py-2">
                <TabsList className="grid w-full grid-cols-2 h-10 bg-muted/50 rounded-xl">
                  <TabsTrigger value="wishlists" className="rounded-lg text-sm font-medium">
                    My Wishlists
                  </TabsTrigger>
                  <TabsTrigger value="collections" className="rounded-lg text-sm font-medium">
                    Collections
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>
            
            <TabsContent value="wishlists" className="mt-0 h-full">
              <MyWishlists />
            </TabsContent>
            
            <TabsContent value="collections" className="mt-0 p-4">
              <CollectionsTab />
            </TabsContent>
          </Tabs>
        </div>
      </ProductProvider>
    );
  }

  // Desktop layout with sidebar
  return (
    <SidebarLayout>
      <ProductProvider>
        <div className="container max-w-6xl mx-auto py-4 sm:py-8 px-3 sm:px-4">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              {pageTitle}
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Manage your wishlists and browse your collections
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="wishlists">My Wishlists</TabsTrigger>
              <TabsTrigger value="collections">Collections</TabsTrigger>
            </TabsList>
            
            <TabsContent value="wishlists" className="mt-6">
              <MyWishlists />
            </TabsContent>
            
            <TabsContent value="collections" className="mt-6">
              <CollectionsTab />
            </TabsContent>
          </Tabs>
        </div>
      </ProductProvider>
    </SidebarLayout>
  );
};

export default Wishlists;
