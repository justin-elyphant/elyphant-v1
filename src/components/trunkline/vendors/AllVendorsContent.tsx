
import React from "react";
import VendorsTable from "./VendorsTable";
import EmptyVendorsState from "./EmptyVendorsState";
import { Vendor } from "./types";

interface AllVendorsContentProps {
  vendors: Vendor[];
  hasSearched: boolean;
}

const AllVendorsContent: React.FC<AllVendorsContentProps> = ({ 
  vendors,
  hasSearched
}) => {
  if (!hasSearched) {
    return <EmptyVendorsState />;
  }
  
  if (vendors.length === 0) {
    return <EmptyVendorsState message="No vendors found matching your search criteria." />;
  }

  return <VendorsTable vendors={vendors} />;
};

export default AllVendorsContent;
