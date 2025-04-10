
import React, { FormEvent } from "react";
import { Search, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ZincSearchFormProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  handleSubmit: (e: FormEvent) => Promise<void>;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  syncProducts: () => void;
  isLoading: boolean;
}

export const ZincSearchForm = ({
  searchTerm,
  setSearchTerm,
  handleSubmit,
  handleKeyDown,
  syncProducts,
  isLoading
}: ZincSearchFormProps) => {
  return (
    <form className="flex gap-2" onSubmit={handleSubmit}>
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search products..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />
      </div>
      <Button 
        type="submit" 
        variant="default" 
        disabled={isLoading || !searchTerm.trim()}
      >
        {isLoading ? "Searching..." : "Search"}
      </Button>
      <Button 
        type="button" 
        variant="outline" 
        onClick={() => syncProducts()} 
        disabled={isLoading}
      >
        <RefreshCw className="h-4 w-4 mr-1" />
        Sync
      </Button>
    </form>
  );
};
