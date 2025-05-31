
import React from "react";
import Header from "@/components/home/Header";
import { useIsMobile } from "@/hooks/use-mobile";
import Footer from "@/components/home/Footer";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const isMobile = useIsMobile();
  
  return (
    <div className="min-h-screen flex flex-col bg-background dark:bg-gray-950">
      {/* Full-width header */}
      <Header />
      
      {/* Full-width main content area */}
      <main className="flex-1">
        {children}
      </main>
      
      {/* Full-width footer */}
      <Footer />
    </div>
  );
};

export default MainLayout;
