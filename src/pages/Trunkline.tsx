
import React from "react";
import { ProductProvider } from "@/contexts/ProductContext";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { TrunklineSidebar } from "@/components/trunkline/TrunklineSidebar";
import TrunklineHeader from "@/components/trunkline/TrunklineHeader";
import { TrunklineGuard } from "@/components/trunkline/auth/TrunklineGuard";
import { TrunklineRouter } from "@/components/trunkline/TrunklineRouter";

const Trunkline = () => {
  return (
    <TrunklineGuard>
      <ProductProvider>
        <SidebarProvider>
          <div className="flex min-h-screen w-full">
            <TrunklineSidebar />
            <SidebarInset className="flex-1">
              <TrunklineHeader />
              <div className="p-6">
                <TrunklineRouter />
              </div>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </ProductProvider>
    </TrunklineGuard>
  );
};

export default Trunkline;
