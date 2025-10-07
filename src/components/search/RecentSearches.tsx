import React from "react";
import { Button } from "@/components/ui/button";
import { Clock, Search } from "lucide-react";

interface RecentSearchesProps {
  searches: string[];
  onSearchSelect: (search: string) => void;
  mobile?: boolean;
}

const RecentSearches: React.FC<RecentSearchesProps> = ({
  searches,
  onSearchSelect,
  mobile = false
}) => {
  if (searches.length === 0) return null;

  return (
    <div className="bg-background border border-border rounded-lg shadow-lg">
      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Recent Searches</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {searches.map((search, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => onSearchSelect(search)}
              className={`text-xs rounded-full hover:bg-accent transition-colors ${
                mobile ? 'min-h-[44px] px-3' : 'h-7 px-2'
              }`}
            >
              <Search className="h-3 w-3 mr-1" />
              {search}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecentSearches;