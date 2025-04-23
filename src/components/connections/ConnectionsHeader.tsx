import React from "react";
import { UserPlus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import FilterOptions from "./FilterOptions";
import { ConnectionFilters } from "@/hooks/useConnections";
import BackToDashboard from "@/components/shared/BackToDashboard";

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
    <>
      <BackToDashboard />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Connections</h1>
          <p className="text-muted-foreground">Manage your friends and followings</p>
        </div>
        <div className="flex gap-2">
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Connection
          </Button>
        </div>
      </div>
      
      <div className="flex items-center space-x-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search connections..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <FilterOptions filters={filters} onFiltersChange={setFilters} />
      </div>
    </>
  );
};

export default ConnectionsHeader;
