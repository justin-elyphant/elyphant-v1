
import React from "react";
import { Outlet } from "react-router-dom";
import Header from "../home/Header";
import Footer from "../home/Footer";
import { useAuth } from "@/contexts/auth";
import DebugPanel from "../debug/DebugPanel";

const MainLayout = () => {
  const { isDebugMode } = useAuth();
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <Outlet />
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
