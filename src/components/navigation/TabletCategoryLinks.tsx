import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const TabletCategoryLinks: React.FC = () => {
  const location = useLocation();
  
  const categories = [
    { label: "Gifts Under $50", path: "/marketplace?giftsUnder50=true" },
    { label: "Wedding", path: "/marketplace?category=wedding" },
    { label: "Baby", path: "/marketplace?category=baby" },
    { label: "Shop All", path: "/marketplace" },
  ];

  const isActive = (path: string) => {
    if (path === "/marketplace") {
      return location.pathname === "/marketplace" && !location.search;
    }
    if (path.includes("giftsUnder50=true")) {
      return location.pathname === "/marketplace" && location.search.includes("giftsUnder50=true");
    }
    return location.pathname === "/marketplace" && location.search.includes(path.split("=")[1]);
  };

  return (
    <nav className="hidden md:flex lg:hidden items-center gap-3 flex-nowrap">
      {categories.map((category) => (
        <Link
          key={category.label}
          to={category.path}
          className={cn(
            "text-sm font-medium text-elyphant-black hover:opacity-70 transition-opacity h-11 flex items-center border-b-2 border-transparent hover:border-elyphant-black/20 whitespace-nowrap",
            isActive(category.path) && "border-elyphant-black"
          )}
        >
          {category.label}
        </Link>
      ))}
    </nav>
  );
};

export default TabletCategoryLinks;
