import React from "react";
import { cn } from "@/lib/utils";

interface LegalLayoutProps {
  children: React.ReactNode;
  className?: string;
}

const LegalLayout: React.FC<LegalLayoutProps> = ({
  children,
  className
}) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Minimal Header with Logo */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center">
            <img 
              src="/lovable-uploads/f2de31b2-3028-48b8-b4ce-22ed58bbcf81.png" 
              alt="Elyphant" 
              className="h-8 w-8 mr-3" 
            />
            <h1 className="text-xl font-bold text-foreground">
              Elyphant
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={cn("flex-1", className)}>
        {children}
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-border bg-muted/30">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Elyphant. All rights reserved.
            </p>
            <div className="flex justify-center space-x-4 text-sm">
              <a href="https://privacy.elyphant.ai" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Privacy Policy
              </a>
              <a href="https://terms.elyphant.ai" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Terms of Service
              </a>
              <a href="https://sms-consent.elyphant.ai" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                SMS Terms
              </a>
            </div>
            <p className="text-xs text-muted-foreground">
              Contact: privacy@elyphant.com | 422 Cribbage Ln. San Marcos, CA 92078
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LegalLayout;