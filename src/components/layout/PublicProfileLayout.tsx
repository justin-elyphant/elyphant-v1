
import React from "react";
import UnifiedShopperHeader from "@/components/navigation/UnifiedShopperHeader";
import Footer from "@/components/home/Footer";
import { cn } from "@/lib/utils";

interface PublicProfileLayoutProps {
  children: React.ReactNode;
  className?: string;
}

const PublicProfileLayout: React.FC<PublicProfileLayoutProps> = ({
  children,
  className
}) => {
  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
      {/* Full header with navigation and search functionality */}
      <UnifiedShopperHeader mode="main" />
      <main className={cn("flex-1 overflow-x-hidden min-w-0", className)}>
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default PublicProfileLayout;
