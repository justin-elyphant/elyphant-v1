
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, CheckCircle, AlertCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Vendor } from "./types";
import { toast } from "sonner";

interface VendorsTableProps {
  vendors: Vendor[];
}

const VendorsTable: React.FC<VendorsTableProps> = ({ vendors }) => {
  // Get status badge based on vendor status
  const getStatusBadge = (status: Vendor['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case 'inactive':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Inactive</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleViewDetails = (vendorId: string) => {
    toast.info(`Viewing vendor details for ID: ${vendorId}`);
  };

  const handleApprove = (vendorId: string) => {
    toast.success(`Vendor ${vendorId} approved`);
  };

  const handleSuspend = (vendorId: string) => {
    toast.info(`Vendor ${vendorId} suspended`);
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Vendor Name</TableHead>
          <TableHead>Categories</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Stripe</TableHead>
          <TableHead>Products</TableHead>
          <TableHead>Sales</TableHead>
          <TableHead>Join Date</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {vendors.map((vendor) => (
          <TableRow key={vendor.id}>
            <TableCell className="font-medium">{vendor.name}</TableCell>
            <TableCell>{vendor.productCategories.join(", ")}</TableCell>
            <TableCell>{getStatusBadge(vendor.status)}</TableCell>
            <TableCell>
              {vendor.stripeConnected ? 
                <CheckCircle className="h-5 w-5 text-green-500" /> : 
                <AlertCircle className="h-5 w-5 text-amber-500" />
              }
            </TableCell>
            <TableCell>{vendor.productsListed}</TableCell>
            <TableCell>${vendor.totalSales.toLocaleString()}</TableCell>
            <TableCell>{new Date(vendor.joinDate).toLocaleDateString()}</TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleViewDetails(vendor.id)}>
                    View Details
                  </DropdownMenuItem>
                  {vendor.status === 'pending' && (
                    <DropdownMenuItem onClick={() => handleApprove(vendor.id)}>
                      Approve
                    </DropdownMenuItem>
                  )}
                  {vendor.status === 'active' && (
                    <DropdownMenuItem onClick={() => handleSuspend(vendor.id)}>
                      Suspend
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default VendorsTable;
