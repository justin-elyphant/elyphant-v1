
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
import { MoreHorizontal, CheckCircle, XCircle, Clock, Ban } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Vendor } from "./types";
import { useVendorApproval } from "@/hooks/trunkline/useVendorApproval";

interface VendorsTableProps {
  vendors: Vendor[];
}

const VendorsTable: React.FC<VendorsTableProps> = ({ vendors }) => {
  const { mutate: performAction, isPending } = useVendorApproval();

  const getStatusBadge = (status: Vendor["approval_status"]) => {
    switch (status) {
      case "approved":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case "suspended":
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200"><Ban className="h-3 w-3 mr-1" />Suspended</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Company</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Website</TableHead>
          <TableHead>Applied</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {vendors.map((vendor) => (
          <TableRow key={vendor.id}>
            <TableCell className="font-medium">{vendor.company_name}</TableCell>
            <TableCell className="text-muted-foreground text-sm">{vendor.contact_email}</TableCell>
            <TableCell>{getStatusBadge(vendor.approval_status)}</TableCell>
            <TableCell className="text-sm">
              {vendor.website ? (
                <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate max-w-[150px] block">
                  {vendor.website.replace(/^https?:\/\//, "")}
                </a>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {new Date(vendor.created_at).toLocaleDateString()}
            </TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" disabled={isPending}>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {vendor.approval_status === "pending" && (
                    <>
                      <DropdownMenuItem
                        onClick={() => performAction({ vendor_account_id: vendor.id, action: "approved" })}
                        className="text-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => performAction({ vendor_account_id: vendor.id, action: "rejected" })}
                        className="text-red-700"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </DropdownMenuItem>
                    </>
                  )}
                  {vendor.approval_status === "approved" && (
                    <DropdownMenuItem
                      onClick={() => performAction({ vendor_account_id: vendor.id, action: "suspended" })}
                      className="text-amber-700"
                    >
                      <Ban className="h-4 w-4 mr-2" />
                      Suspend
                    </DropdownMenuItem>
                  )}
                  {(vendor.approval_status === "suspended" || vendor.approval_status === "rejected") && (
                    <DropdownMenuItem
                      onClick={() => performAction({ vendor_account_id: vendor.id, action: "approved" })}
                      className="text-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Re-approve
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
