
import React from "react";
import { Search, UserPlus, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ConnectionFilters } from "@/types/connection-filters";

interface ConnectionsHeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filters: ConnectionFilters;
  setFilters: (filters: ConnectionFilters) => void;
}

const ConnectionsHeader: React.FC<ConnectionsHeaderProps> = ({
  searchTerm,
  setSearchTerm,
  filters,
  setFilters
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
      <div className="w-full sm:w-auto">
        <h1 className="text-2xl font-bold mb-2">Connections</h1>
        <p className="text-muted-foreground">
          Manage your friends and connections
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search connections..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full sm:w-64"
          />
        </div>
        
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
        
        <Button size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          Add Friend
        </Button>
      </div>
    </div>
  );
};

export default ConnectionsHeader;
