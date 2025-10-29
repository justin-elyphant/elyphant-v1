import React from "react";
import { useAuth } from "@/contexts/auth";
import UnifiedShopperHeader from "@/components/navigation/UnifiedShopperHeader";
import Footer from "@/components/home/Footer";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

interface UnifiedProfileLayoutProps {
  children: React.ReactNode;
  isOwnProfile: boolean;
}

/**
 * UNIFIED PROFILE LAYOUT
 * 
 * Single layout component that handles all profile types:
 * - Own profile: Shows sidebar navigation for authenticated users
 * - Public/Connection profiles: Shows standard header/footer layout
 * 
 * Eliminates layout switching complexity and ensures consistent full-width behavior
 */
const UnifiedProfileLayout: React.FC<UnifiedProfileLayoutProps> = ({
  children,
  isOwnProfile
}) => {
  const { user } = useAuth();

  // Own profile layout with sidebar (for authenticated users) - no main header
  if (isOwnProfile && user) {
    return (
      <div className="min-h-screen w-full bg-background">
        <SidebarProvider defaultOpen={false}>
          <div className="flex w-full min-h-screen">
            <AppSidebar />
            <SidebarInset className="flex-1">
              <main className="flex-1 w-full" style={{ width: '100%', maxWidth: 'none' }}>
                {children}
              </main>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </div>
    );
  }

  // Public/connection profile layout (no main header - profile has its own header)
  return (
    <div className="min-h-screen w-full bg-background flex flex-col" style={{ width: '100vw', maxWidth: '100vw' }}>
      <main className="flex-1 w-full" style={{ width: '100%', maxWidth: 'none' }}>
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default UnifiedProfileLayout;