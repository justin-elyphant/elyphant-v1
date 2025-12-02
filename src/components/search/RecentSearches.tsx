import React from "react";
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
    <div className="bg-background border border-border rounded-lg shadow-lg overflow-hidden">
      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-sm font-medium text-muted-foreground">Recent Searches</span>
        </div>
        <div className="flex flex-col">
          {searches.map((search, index) => (
            <button
              key={index}
              onClick={() => onSearchSelect(search)}
              title={search}
              className={`flex items-center gap-2 w-full text-left px-2 py-2 rounded-md hover:bg-accent transition-colors ${
                mobile ? 'min-h-[44px]' : ''
              }`}
            >
              <Search className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <span className="text-sm truncate">{search}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecentSearches;
