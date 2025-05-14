
import React from "react";
import { ResponsiveLayout } from "./ResponsiveLayout";
import { ResponsiveNavigation } from "./ResponsiveNavigation";
import { ResponsiveContainer } from "./ResponsiveContainer";
import { useIsMobile } from "@/hooks/use-mobile";

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
      
      <footer className="py-6 text-center text-sm text-muted-foreground border-t dark:border-gray-800">
        <ResponsiveContainer>
          <p>
            &copy; {new Date().getFullYear()} Gift Giver. All rights reserved.
          </p>
          
          {/* Additional footer links can be added here */}
          {!isMobile && (
            <div className="mt-2 flex items-center justify-center space-x-4 text-xs">
              <a href="#" className="hover:underline">Privacy Policy</a>
              <a href="#" className="hover:underline">Terms of Service</a>
              <a href="#" className="hover:underline">Contact Us</a>
            </div>
          )}
        </ResponsiveContainer>
      </footer>
    </div>
  );
};

export default MainLayout;
