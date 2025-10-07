
import React, { useLayoutEffect, useRef, useState } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import UnifiedShopperHeader from "@/components/navigation/UnifiedShopperHeader";

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const headerWrapperRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState<number>(120);

  useLayoutEffect(() => {
    const update = () => {
      const el = headerWrapperRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      // Add a small buffer to completely avoid overlap
      setHeaderHeight(Math.ceil(rect.height) + 8);
    };

    update();
    window.addEventListener("resize", update);
    const ro = new ResizeObserver(update);
    if (headerWrapperRef.current) ro.observe(headerWrapperRef.current);

    return () => {
      window.removeEventListener("resize", update);
      ro.disconnect();
    };
  }, []);

  // Measure bottom navigation height and expose as CSS variable for safe spacing
  useLayoutEffect(() => {
    const updateBottomNav = () => {
      try {
        const nav = document.querySelector('.mobile-bottom-nav') as HTMLElement | null;
        if (!nav) return;
        const rect = nav.getBoundingClientRect();
        const height = Math.ceil(rect.height);
        document.documentElement.style.setProperty('--bottom-nav-height', `${height}px`);
      } catch {}
    };

    updateBottomNav();
    window.addEventListener('resize', updateBottomNav);

    const nav = document.querySelector('.mobile-bottom-nav') as HTMLElement | null;
    const ro2 = nav ? new ResizeObserver(() => updateBottomNav()) : null;
    if (nav && ro2) ro2.observe(nav);

    return () => {
      window.removeEventListener('resize', updateBottomNav);
      ro2?.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen w-full overflow-x-hidden max-w-[100vw]">
      {/* Fixed header wrapper with measured height */}
      <div ref={headerWrapperRef} className="fixed top-0 left-0 right-0 z-50 overflow-x-hidden max-w-[100vw]">
        <UnifiedShopperHeader mode="main" />
      </div>
      
      {/* Sidebar layout below header */}
      <SidebarProvider defaultOpen={false}>
        <div
          className="flex w-full overflow-x-hidden"
          style={{
            height: "100vh",
            paddingTop: `calc(${headerHeight}px + env(safe-area-inset-top, 0px))`,
          }}
        >
          <AppSidebar />
          <SidebarInset className="flex-1">
            <main className="h-full overflow-y-auto overflow-x-hidden pb-safe-bottom mobile-container ios-scroll max-w-[100vw]">
              {children}
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}
