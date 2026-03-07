
import React from "react";
import VendorsTable from "./VendorsTable";
import EmptyVendorsState from "./EmptyVendorsState";
import { Vendor } from "./types";
import { Loader2 } from "lucide-react";

interface AllVendorsContentProps {
  vendors: Vendor[];
  isLoading: boolean;
  emptyMessage?: string;
}

const AllVendorsContent: React.FC<AllVendorsContentProps> = ({ 
  vendors,
  isLoading,
  emptyMessage = "No vendors found. Try searching or adjusting filters."
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (vendors.length === 0) {
    return <EmptyVendorsState message={emptyMessage} />;
  }

  return <VendorsTable vendors={vendors} />;
};

export default AllVendorsContent;
