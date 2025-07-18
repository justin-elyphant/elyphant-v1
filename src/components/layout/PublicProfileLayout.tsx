
import React from "react";
import Header from "@/components/home/Header";
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
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className={cn("flex-1", className)}>
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default PublicProfileLayout;
