
import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const MarketplaceHeader = () => {
  return (
    <div className="mb-8">
      <h1 className="text-4xl font-bold mb-4">Vendor Marketplace</h1>
      <p className="text-muted-foreground mb-6">
        Discover products from our partner retailers and vendors
      </p>
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input 
          placeholder="Search products across all vendors..." 
          className="pl-10"
        />
      </div>
    </div>
  );
};

export default MarketplaceHeader;
