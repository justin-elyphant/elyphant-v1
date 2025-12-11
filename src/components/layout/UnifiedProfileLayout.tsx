import React from "react";
import { useAuth } from "@/contexts/auth";
import UnifiedShopperHeader from "@/components/navigation/UnifiedShopperHeader";
import Footer from "@/components/home/Footer";

interface UnifiedProfileLayoutProps {
  children: React.ReactNode;
  isOwnProfile: boolean;
}

/**
 * UNIFIED PROFILE LAYOUT
 * 
 * Single layout component that handles all profile types:
 * - Own profile: Shows main header + content
 * - Public/Connection profiles: Shows main header + content
 * 
 * Eliminates layout switching complexity and ensures consistent full-width behavior
 * iOS Capacitor compliant with safe area padding
 */
const UnifiedProfileLayout: React.FC<UnifiedProfileLayoutProps> = ({
  children,
  isOwnProfile
}) => {
  const { user } = useAuth();

  // Own profile layout with main header
  if (isOwnProfile && user) {
    return (
      <div className="min-h-screen w-full bg-background flex flex-col pb-safe">
        <div className="sticky top-0 z-50">
          <UnifiedShopperHeader mode="main" />
        </div>
        <main className="flex-1 w-full pb-20 lg:pb-8 relative z-0" style={{ width: '100%', maxWidth: 'none' }}>
          {children}
        </main>
        <Footer />
      </div>
    );
  }

  // Public/connection profile layout with main header
  return (
    <div className="min-h-screen w-full bg-background flex flex-col pb-safe" style={{ width: '100vw', maxWidth: '100vw' }}>
      <div className="sticky top-0 z-50">
        <UnifiedShopperHeader mode="main" />
      </div>
      <main className="flex-1 w-full pb-20 lg:pb-8 relative z-0" style={{ width: '100%', maxWidth: 'none' }}>
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default UnifiedProfileLayout;
