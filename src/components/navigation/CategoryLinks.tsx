import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const CategoryLinks: React.FC = () => {
  const location = useLocation();
  
  const categories = [
    { label: "Beauty", path: "/marketplace?category=beauty" },
    { label: "Electronics", path: "/marketplace?category=electronics" },
    { label: "Fashion", path: "/marketplace?category=fashion" },
    { label: "Gifts Under $50", path: "/marketplace?category=gifts-under-50" },
    { label: "Wedding", path: "/marketplace?category=wedding" },
    { label: "Baby", path: "/marketplace?category=baby" },
    { label: "Shop All", path: "/marketplace" },
  ];

  const isActive = (path: string) => {
    if (path === "/marketplace") {
      return location.pathname === "/marketplace" && !location.search;
    }
    const categoryMatch = path.match(/category=([^&]+)/);
    if (categoryMatch) {
      return location.pathname === "/marketplace" && location.search.includes(`category=${categoryMatch[1]}`);
    }
    return false;
  };

  return (
    <nav className="hidden md:flex items-center gap-4 lg:gap-6 overflow-x-auto scrollbar-hide">
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

export default CategoryLinks;
