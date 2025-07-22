
import React from "react";
import Header from "@/components/home/Header";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-gray-50">
      {/* Full-width header */}
      <Header />
      
      {/* Main content area */}
      <main className="pt-4">
        {children}
      </main>
    </div>
  );
}
