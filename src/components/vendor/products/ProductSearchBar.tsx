
import React from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface ProductSearchBarProps {
  searchTerm: string;
  setSearchTerm: (searchTerm: string) => void;
}

export const ProductSearchBar = ({ searchTerm, setSearchTerm }: ProductSearchBarProps) => {
  return (
    <div className="mb-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input 
          placeholder="Search products, collections, or tags..." 
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
    </div>
  );
};
