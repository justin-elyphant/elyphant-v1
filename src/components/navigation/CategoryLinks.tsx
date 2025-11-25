import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const CategoryLinks: React.FC = () => {
  const location = useLocation();
  
  const categories = [
    { label: "Beauty", path: "/marketplace?category=beauty" },
    { label: "Electronics", path: "/marketplace?category=electronics" },
    { label: "Fashion", path: "/marketplace?category=fashion" },
    { label: "Shop All", path: "/marketplace" },
  ];

  const isActive = (path: string) => {
    if (path === "/marketplace") {
      return location.pathname === "/marketplace" && !location.search;
    }
    return location.pathname === "/marketplace" && location.search.includes(path.split("=")[1]);
  };

  return (
    <nav className="hidden lg:flex items-center gap-6">
      {categories.map((category) => (
        <Link
          key={category.label}
          to={category.path}
          className={cn(
            "text-sm font-medium text-elyphant-black hover:opacity-70 transition-opacity h-11 flex items-center border-b-2 border-transparent hover:border-elyphant-black/20",
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
