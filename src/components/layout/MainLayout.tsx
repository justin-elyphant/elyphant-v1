
import React from "react";
import Header from "@/components/home/Header";
import Footer from "@/components/home/Footer";
import FloatingNicoleWidget from "@/components/ai/enhanced/FloatingNicoleWidget";
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
  const handleNavigateToResults = (searchQuery: string) => {
    // Navigate to marketplace with search query
    const searchParams = new URLSearchParams();
    searchParams.set("search", searchQuery);
    window.location.href = `/marketplace?${searchParams.toString()}`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header className={headerClassName} />
      <main className={cn("flex-1", className)}>
        {children}
      </main>
      <Footer className={footerClassName} />
      
      {/* Floating Nicole Chat Widget */}
      <FloatingNicoleWidget 
        position="bottom-right"
        defaultMinimized={true}
        onNavigateToResults={handleNavigateToResults}
      />
    </div>
  );
};

export default MainLayout;
