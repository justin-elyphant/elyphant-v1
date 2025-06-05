
import React from "react";
import Header from "@/components/home/Header";
import Footer from "@/components/home/Footer";
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
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header className={headerClassName} />
      <main className={cn("flex-1", className)}>
        {children}
      </main>
      <Footer className={footerClassName} />
    </div>
  );
};

export default MainLayout;
