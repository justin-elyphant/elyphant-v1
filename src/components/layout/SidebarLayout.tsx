
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
      {/* Full-width header */}
      <Header />
      
      {/* Sidebar layout below header */}
      <SidebarProvider defaultOpen={false}>
        <div className="flex w-full" style={{ height: 'calc(100vh - 73px)' }}>
          <AppSidebar />
          <SidebarInset className="flex-1">
            <main className="flex-1 p-4">
              {children}
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}
