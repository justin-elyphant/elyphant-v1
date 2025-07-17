import React from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import Header from "@/components/home/Header";

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-col">
          {/* Header with sidebar trigger */}
          <div className="sticky top-0 z-50 bg-white border-b">
            <div className="flex items-center px-4">
              <SidebarTrigger className="-ml-1 mr-2" />
              <div className="flex-1">
                <Header className="border-none bg-transparent" />
              </div>
            </div>
          </div>
          
          {/* Main content */}
          <main className="flex-1">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}