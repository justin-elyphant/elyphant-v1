
import React from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import UnifiedShopperHeader from "@/components/navigation/UnifiedShopperHeader";
import Footer from "@/components/home/Footer";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  footerClassName?: string;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  className,
  headerClassName,
  footerClassName
}) => {
  const location = useLocation();
  
  return (
    <div className="min-h-screen surface-primary flex flex-col">
      <UnifiedShopperHeader mode="main" className={headerClassName} />
      <main className={cn("flex-1", className)}>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </main>
      <Footer className={footerClassName} />
    </div>
  );
};

export default MainLayout;
