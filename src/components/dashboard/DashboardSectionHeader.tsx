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
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-heading-3 font-semibold">{title}</h2>
      {viewAllLink && (
        <Link 
          to={viewAllLink}
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          {viewAllText}
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
};

export default DashboardSectionHeader;
