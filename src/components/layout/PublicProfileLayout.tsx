
import React from "react";
import { Link } from "react-router-dom";
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
    <div className="min-h-screen bg-background">
      {/* Minimal header with just logo and sign-in link */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-border/40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img 
              src="/lovable-uploads/f2de31b2-3028-48b8-b4ce-22ed58bbcf81.png" 
              alt="Elyphant" 
              className="h-8 w-8 mr-2" 
            />
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Elyphant
            </h1>
          </Link>
          
          <Link 
            to="/auth" 
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Main content area */}
      <main className={cn("", className)}>
        {children}
      </main>

      {/* Minimal footer */}
      <footer className="border-t border-border/40 bg-muted/30">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center text-sm text-muted-foreground">
            <span>Powered by</span>
            <Link to="/" className="ml-1 font-medium text-primary hover:underline">
              Elyphant
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicProfileLayout;
