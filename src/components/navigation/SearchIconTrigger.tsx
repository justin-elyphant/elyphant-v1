import React, { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import AIEnhancedSearchBar from "@/components/search/AIEnhancedSearchBar";

const SearchIconTrigger: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[90vw] md:w-[500px] p-4" 
        align="end"
        side="bottom"
      >
        <AIEnhancedSearchBar 
          onNavigateToResults={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
};

export default SearchIconTrigger;
