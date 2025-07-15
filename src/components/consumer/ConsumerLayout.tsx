import React from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { ConsumerSidebar } from "./ConsumerSidebar";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/contexts/profile/ProfileContext";
import { Skeleton } from "@/components/ui/skeleton";

interface ConsumerLayoutProps {
  children: React.ReactNode;
}

export function ConsumerLayout({ children }: ConsumerLayoutProps) {
  const { user, isLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();

  // Show loading skeleton while authentication is being checked
  if (isLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          <div className="w-60 h-screen bg-white border-r border-slate-200">
            <div className="p-4">
              <Skeleton className="h-8 w-32 mb-4" />
              <Skeleton className="h-9 w-full" />
            </div>
            <div className="px-4 space-y-2">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          </div>
          <div className="flex-1 p-6">
            <Skeleton className="h-10 w-64 mb-6" />
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <ConsumerSidebar />
        <SidebarInset className="flex-1">
          <header className="h-12 flex items-center border-b border-slate-200 bg-white px-4">
            <SidebarTrigger className="mr-2" />
            <div className="flex-1" />
            {/* Add any header content here like notifications, search, etc. */}
          </header>
          <main className="flex-1 bg-gray-50">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}