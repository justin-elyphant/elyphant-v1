
import React, { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Toaster } from 'sonner';
import Header from "../home/Header";
import Footer from "../home/Footer";
import { useAuth } from "@/contexts/auth";
import DebugPanel from "../debug/DebugPanel";

interface MainLayoutProps {
  children?: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  // Use a try/catch to handle the case where useAuth is called outside of AuthProvider
  let isDebugMode = false;
  
  try {
    const authContext = useAuth();
    isDebugMode = authContext?.isDebugMode || false;
  } catch (error) {
    console.warn("Auth context not available in MainLayout");
    // Continue with default values if context is not available
  }
  
  const location = useLocation();
  
  // Scroll to top whenever the route changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header /> {/* Always render the header */}
      <Toaster />
      <main className="flex-grow">
        {children || <Outlet />}
      </main>
      <Footer />
      
      {/* Debug Panel - always rendered but only visible when toggled */}
      <DebugPanel />
      
      {/* Debug mode indicator */}
      {isDebugMode && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-400 text-black text-xs font-bold px-2 py-0.5 text-center z-50">
          DEBUG MODE ACTIVE - Authentication may be bypassed
        </div>
      )}
    </div>
  );
};

export default MainLayout;
