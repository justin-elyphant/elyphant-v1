
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, ChevronUp, ChevronDown } from "lucide-react";
import type { UnifiedMessage } from "@/services/UnifiedMessagingService";

interface MessageSearchProps {
  messages: UnifiedMessage[];
  onSearchResultClick: (messageId: string) => void;
  onClose: () => void;
}

const MessageSearch = ({ messages, onSearchResultClick, onClose }: MessageSearchProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  const searchResults = messages.filter(message =>
    message.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleNext = () => {
    if (searchResults.length > 0) {
      const nextIndex = (currentIndex + 1) % searchResults.length;
      setCurrentIndex(nextIndex);
      onSearchResultClick(searchResults[nextIndex].id);
    }
  };

  const handlePrevious = () => {
    if (searchResults.length > 0) {
      const prevIndex = currentIndex === 0 ? searchResults.length - 1 : currentIndex - 1;
      setCurrentIndex(prevIndex);
      onSearchResultClick(searchResults[prevIndex].id);
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 border-b bg-muted/30">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search messages..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 pr-4"
        />
      </div>
      
      {searchTerm && (
        <>
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {searchResults.length > 0 ? `${currentIndex + 1} of ${searchResults.length}` : "No results"}
          </span>
          
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={handlePrevious}
              disabled={searchResults.length === 0}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={handleNext}
              disabled={searchResults.length === 0}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}
      
      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onClose}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default MessageSearch;
