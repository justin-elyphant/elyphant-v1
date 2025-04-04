
import React from "react";
import { Outlet } from "react-router-dom";
import Header from "@/components/home/Header";
import { ViewportToggle } from "@/components/ui/viewport-toggle";

const MainLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <ViewportToggle />
    </div>
  );
};

export default MainLayout;
