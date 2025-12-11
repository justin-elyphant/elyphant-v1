import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

interface DashboardSectionHeaderProps {
  title: string;
  viewAllLink?: string;
  viewAllText?: string;
}

const DashboardSectionHeader = ({ 
  title, 
  viewAllLink, 
  viewAllText = "View all" 
}: DashboardSectionHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 mb-4">
      <h2 className="text-lg sm:text-xl font-semibold">{title}</h2>
      {viewAllLink && (
        <Link 
          to={viewAllLink}
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors min-h-[44px] sm:min-h-0"
        >
          {viewAllText}
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
};

export default DashboardSectionHeader;
