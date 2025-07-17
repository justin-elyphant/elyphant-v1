
import React from "react";
import NavigationBar from "./components/NavigationBar";
import { cn } from "@/lib/utils";

interface HeaderProps {
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ className }) => {
  return (
    <header className={cn("sticky top-0 z-50 bg-white border-b", className)}>
      <NavigationBar />
    </header>
  );
};

export default Header;
