
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";

interface MobileSearchHeaderProps {
  searchTerm: string;
}

const MobileSearchHeader = ({ searchTerm }: MobileSearchHeaderProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localSearchTerm.trim()) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set("search", localSearchTerm.trim());
      newParams.delete("category");
      setSearchParams(newParams);
    }
  };

  const clearSearch = () => {
    setLocalSearchTerm("");
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("search");
    setSearchParams(newParams);
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 safe-area-top">
      <form onSubmit={handleSearchSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="search"
          placeholder="Search for gifts..."
          value={localSearchTerm}
          onChange={(e) => setLocalSearchTerm(e.target.value)}
          className="w-full pl-10 pr-12 h-11 text-base border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
        {localSearchTerm && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </form>
    </div>
  );
};

export default MobileSearchHeader;
