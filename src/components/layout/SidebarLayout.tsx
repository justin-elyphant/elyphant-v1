
import React from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import Header from "@/components/home/Header";

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  return (
    <div className="min-h-screen w-full">
      {/* Fixed header with higher z-index */}
      <Header className="fixed top-0 left-0 right-0 z-50" />
      
      {/* Sidebar layout below header */}
      <SidebarProvider defaultOpen={false}>
        <div className="flex w-full" style={{ height: '100vh', paddingTop: '80px' }}>
          <AppSidebar />
          <SidebarInset className="flex-1">
            <main className="h-full overflow-y-auto">
              {children}
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}
