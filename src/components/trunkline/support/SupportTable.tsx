
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SupportRequest, SupportStatus } from "./types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface SupportTableProps {
  requests: SupportRequest[];
}

const SupportTable: React.FC<SupportTableProps> = ({ requests }) => {
  // Get status badge color based on status
  const getStatusBadge = (status: SupportStatus) => {
    switch (status) {
      case 'open':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Open</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">In Progress</Badge>;
      case 'resolved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Resolved</Badge>;
      case 'vendor_action':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Vendor Action</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleStatusChange = (requestId: string, newStatus: SupportStatus) => {
    toast.success("Status updated", {
      description: `Support request ${requestId} status changed to ${newStatus.replace('_', ' ')}`
    });
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Request ID</TableHead>
          <TableHead>Order ID</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Subject</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Vendor</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((request) => (
          <TableRow key={request.id}>
            <TableCell className="font-medium">#{request.id.slice(-6)}</TableCell>
            <TableCell>
              <Button variant="link" className="p-0 h-auto" asChild>
                <a href={`/orders/${request.orderId}`}>#{request.orderId.slice(-6)}</a>
              </Button>
            </TableCell>
            <TableCell>
              <div>{request.customerName}</div>
              <div className="text-xs text-muted-foreground">{request.customerEmail}</div>
            </TableCell>
            <TableCell>{request.subject}</TableCell>
            <TableCell>{getStatusBadge(request.status)}</TableCell>
            <TableCell>{request.vendorName}</TableCell>
            <TableCell>{new Date(request.createdAt).toLocaleDateString()}</TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <a href={`/trunkline/support/${request.id}`}>View Details</a>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange(request.id, 'in_progress')}>
                    Mark as In Progress
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange(request.id, 'resolved')}>
                    Mark as Resolved
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange(request.id, 'vendor_action')}>
                    Assign to Vendor
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default SupportTable;
