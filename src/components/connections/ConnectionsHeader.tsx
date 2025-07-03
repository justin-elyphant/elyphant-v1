
import React, { useState } from "react";
import { Search, UserPlus, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ConnectionFilters } from "@/types/connection-filters";
import EnhancedConnectionSearch from "./EnhancedConnectionSearch";

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
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);

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
            placeholder="Filter connections..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full sm:w-64"
          />
        </div>
        
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
        
        <Dialog open={searchDialogOpen} onOpenChange={setSearchDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              Find Friends
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Find New Connections</DialogTitle>
            </DialogHeader>
            <EnhancedConnectionSearch />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ConnectionsHeader;
