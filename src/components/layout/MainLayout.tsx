
import React from "react";
import Header from "@/components/home/Header";
import Footer from "@/components/home/Footer";
// TEMPORARILY DISABLED: FloatingNicoleWidget - Re-enable when technical issues are resolved
// import FloatingNicoleWidget from "@/components/ai/enhanced/FloatingNicoleWidget";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  footerClassName?: string;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  className,
  headerClassName,
  footerClassName
}) => {
  // TEMPORARILY DISABLED: NavigateToResults handler for FloatingNicoleWidget
  // const handleNavigateToResults = (searchQuery: string) => {
  //   // Navigate to marketplace with search query
  //   const searchParams = new URLSearchParams();
  //   searchParams.set("search", searchQuery);
  //   window.location.href = `/marketplace?${searchParams.toString()}`;
  // };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with AIEnhancedSearchBar and Enhanced Zinc API System */}
      <Header className={headerClassName} />
      
      {/* Main content area */}
      <main className={cn("flex-1", className)}>
        {children}
      </main>
      
      {/* Footer */}
      <Footer className={footerClassName} />
      
      {/* TEMPORARILY DISABLED: Floating Nicole Chat Widget - Re-enable when technical issues are resolved */}
      {/* 
      <FloatingNicoleWidget 
        position="bottom-right"
        defaultMinimized={true}
        onNavigateToResults={handleNavigateToResults}
      />
      */}
    </div>
  );
};

export default MainLayout;
