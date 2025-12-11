import React from "react";
import { useAuth } from "@/contexts/auth";
import Footer from "@/components/home/Footer";

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
 * iOS Capacitor compliant with safe area padding
 */
const UnifiedProfileLayout: React.FC<UnifiedProfileLayoutProps> = ({
  children,
  isOwnProfile
}) => {
  const { user } = useAuth();

  // Own profile layout (no main header or sidebar on profile to avoid overlay)
  if (isOwnProfile && user) {
    return (
      <div className="min-h-screen w-full bg-background flex flex-col pb-safe">
        <main className="flex-1 w-full pb-20 lg:pb-8" style={{ width: '100%', maxWidth: 'none' }}>
          {children}
        </main>
        <Footer />
      </div>
    );
  }

  // Public/connection profile layout (no main header - profile has its own header)
  return (
    <div className="min-h-screen w-full bg-background flex flex-col pb-safe" style={{ width: '100vw', maxWidth: '100vw' }}>
      <main className="flex-1 w-full pb-20 lg:pb-8" style={{ width: '100%', maxWidth: 'none' }}>
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default UnifiedProfileLayout;
