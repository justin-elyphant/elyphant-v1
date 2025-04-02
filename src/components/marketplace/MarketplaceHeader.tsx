
import React, { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate, useLocation } from "react-router-dom";
import { Link } from "react-router-dom";

const MarketplaceHeader = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(location.search);
    params.set("search", searchTerm);
    navigate(`${location.pathname}?${params.toString()}`);
  };

  return (
    <div className="mb-8">
      <div className="flex items-center mb-4">
        <img 
          src="/lovable-uploads/f2de31b2-3028-48b8-b4ce-22ed58bbcf81.png" 
          alt="Elyphant" 
          className="h-10 w-10 mr-3" 
        />
        <h1 className="text-4xl font-bold">Vendor Marketplace</h1>
      </div>
      <p className="text-muted-foreground mb-6">
        Discover products from our partner retailers and vendors
      </p>
      
      <form onSubmit={handleSearch}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input 
            placeholder="Search products across all vendors..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </form>
    </div>
  );
};

export default MarketplaceHeader;
