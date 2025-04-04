
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Connection } from "@/types/connections";
import FollowingCard from "./FollowingCard";

interface FollowingTabContentProps {
  following: Connection[];
  searchTerm: string;
}

const FollowingTabContent: React.FC<FollowingTabContentProps> = ({ following, searchTerm }) => {
  if (following.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium mb-2">Not following anyone</h3>
        <p className="text-muted-foreground mb-4">
          {searchTerm 
            ? `No results for "${searchTerm}"`
            : "You haven't followed anyone yet"}
        </p>
        <Button asChild>
          <Link to="/connections?tab=suggestions">Discover People</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {following.map(follow => (
        <FollowingCard key={follow.id} connection={follow} />
      ))}
    </div>
  );
};

export default FollowingTabContent;
