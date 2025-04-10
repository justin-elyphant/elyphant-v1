
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
import { MessageSquare } from "lucide-react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { VendorSupportRequest } from "./types";
import { formatDate } from "./utils";

interface SupportTableProps {
  requests: VendorSupportRequest[];
  onSelectRequest: (request: VendorSupportRequest) => void;
}

const SupportTable: React.FC<SupportTableProps> = ({ requests, onSelectRequest }) => {
  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending_vendor":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Action Required</Badge>;
      case "in_progress":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">In Progress</Badge>;
      case "resolved":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Resolved</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order ID</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Subject</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Return</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((request) => (
          <TableRow key={request.id}>
            <TableCell className="font-medium">
              #{request.orderId.slice(-6)}
            </TableCell>
            <TableCell>{request.customerName}</TableCell>
            <TableCell>{request.subject}</TableCell>
            <TableCell>{getStatusBadge(request.status)}</TableCell>
            <TableCell>
              {request.hasReturn ? (
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  Requested
                </Badge>
              ) : (
                "None"
              )}
            </TableCell>
            <TableCell>{formatDate(request.dateCreated)}</TableCell>
            <TableCell className="text-right">
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={() => onSelectRequest(request)}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    View & Reply
                  </Button>
                </DialogTrigger>
              </Dialog>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default SupportTable;
