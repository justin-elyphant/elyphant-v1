
import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, UserPlus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ConnectionsHeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const ConnectionsHeader: React.FC<ConnectionsHeaderProps> = ({ searchTerm, setSearchTerm }) => {
  return (
    <>
      <div className="mb-6">
        <Button variant="ghost" asChild className="p-0">
          <Link to="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

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
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>
    </>
  );
};

export default ConnectionsHeader;
