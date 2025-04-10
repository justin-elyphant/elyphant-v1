
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  Filter, 
  MessageSquare, 
  MoreHorizontal,
  Calendar
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// Define the support request status types
type SupportStatus = 'open' | 'in_progress' | 'resolved' | 'vendor_action';

// Define a support request type
interface SupportRequest {
  id: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  subject: string;
  status: SupportStatus;
  vendorName: string;
  createdAt: string;
  lastUpdated: string;
}

const TrunklineSupportTab = () => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('all');

  // Mock data for support requests
  const mockRequests: SupportRequest[] = [
    {
      id: 'sup_123456',
      orderId: 'ord_789012',
      customerName: 'Jane Smith',
      customerEmail: 'jane.smith@example.com',
      subject: 'Missing item in order',
      status: 'open',
      vendorName: 'Amazon via Zinc',
      createdAt: '2025-04-08T10:15:00Z',
      lastUpdated: '2025-04-08T10:15:00Z'
    },
    {
      id: 'sup_123457',
      orderId: 'ord_789013',
      customerName: 'John Doe',
      customerEmail: 'john.doe@example.com',
      subject: 'Wrong size received',
      status: 'in_progress',
      vendorName: 'Nike',
      createdAt: '2025-04-07T14:30:00Z',
      lastUpdated: '2025-04-08T09:45:00Z'
    },
    {
      id: 'sup_123458',
      orderId: 'ord_789014',
      customerName: 'Alex Johnson',
      customerEmail: 'alex.johnson@example.com',
      subject: 'Damaged packaging',
      status: 'vendor_action',
      vendorName: 'Adidas',
      createdAt: '2025-04-06T11:45:00Z',
      lastUpdated: '2025-04-07T13:20:00Z'
    },
    {
      id: 'sup_123459',
      orderId: 'ord_789015',
      customerName: 'Sarah Williams',
      customerEmail: 'sarah.williams@example.com',
      subject: 'Return request help',
      status: 'resolved',
      vendorName: 'Apple',
      createdAt: '2025-04-05T09:30:00Z',
      lastUpdated: '2025-04-06T16:10:00Z'
    }
  ];

  // Filter requests based on selected filters
  const filteredRequests = mockRequests.filter(request => {
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesSearch = 
      searchTerm === '' || 
      request.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.orderId.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Simple date filter - could be enhanced with actual date logic
    const matchesDate = dateFilter === 'all';

    return matchesStatus && matchesSearch && matchesDate;
  });

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
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Support Requests</CardTitle>
          <Button>
            <MessageSquare className="h-4 w-4 mr-2" />
            New Support Request
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                type="search" 
                placeholder="Search by order ID, customer, or subject..." 
                className="pl-8" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="vendor_action">Vendor Action</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>
          
          {filteredRequests.length > 0 ? (
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
                {filteredRequests.map((request) => (
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
          ) : (
            <div className="border rounded-md p-8 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No support requests match your filters.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TrunklineSupportTab;
