
import React from "react";
import { ResponsiveNavigation } from "./ResponsiveNavigation";
import { ResponsiveContainer } from "./ResponsiveContainer";
import { useIsMobile } from "@/hooks/use-mobile";
import Footer from "@/components/home/Footer"; // Import the detailed footer

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const isMobile = useIsMobile();
  
  return (
    <div className="min-h-screen flex flex-col bg-background dark:bg-gray-950">
      <ResponsiveNavigation />
      
      <main className="flex-1">
        <ResponsiveContainer 
          className={isMobile ? "py-4" : "py-6"}
        >
          {children}
        </ResponsiveContainer>
      </main>
      
      <Footer /> {/* Use the detailed Footer component */}
    </div>
  );
};

export default MainLayout;
