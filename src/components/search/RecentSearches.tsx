import React from "react";
import { Clock, Search, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RecentSearchesProps {
  searches: string[];
  onSearchSelect: (search: string) => void;
  onRemoveSearch?: (search: string) => void;
  onClearAll?: () => void;
  mobile?: boolean;
  /** When true, renders without its own Card wrapper (for embedding inside another Card) */
  embedded?: boolean;
}

const RecentSearches: React.FC<RecentSearchesProps> = ({
  searches,
  onSearchSelect,
  onRemoveSearch,
  onClearAll,
  mobile = false,
  embedded = false
}) => {
  if (searches.length === 0) return null;

  const content = (
    <div className={embedded ? "" : "p-3"}>
      <div className="flex items-center justify-between mb-2 px-2">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-xs font-medium text-muted-foreground uppercase">Recent</span>
        </div>
        {onClearAll && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onClearAll();
            }}
            className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Clear all
          </Button>
        )}
      </div>
      <div className="flex flex-col">
        {searches.map((search, index) => (
          <div
            key={index}
            className={`flex items-center gap-2 w-full px-2 py-2 rounded-md hover:bg-accent transition-colors group ${
              mobile ? 'min-h-[44px]' : ''
            }`}
          >
            <button
              onClick={() => onSearchSelect(search)}
              title={search}
              className="flex items-center gap-2 flex-1 min-w-0 text-left"
            >
              <Search className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <span className="text-sm truncate">{search}</span>
            </button>
            {onRemoveSearch && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveSearch(search);
                }}
                className="h-6 w-6 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 hover:bg-muted-foreground/10 transition-opacity shrink-0"
                aria-label={`Remove "${search}" from history`}
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  if (embedded) return content;

  return (
    <div className="bg-background border border-border rounded-lg shadow-lg overflow-hidden">
      {content}
    </div>
  );
};

export default RecentSearches;
