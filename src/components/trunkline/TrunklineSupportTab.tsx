
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import SupportSearch from "./support/SupportSearch";
import SupportTable from "./support/SupportTable";
import EmptySupport from "./support/EmptySupport";
import { mockRequests } from "./support/mockData";
import { SupportRequest } from "./support/types";

const TrunklineSupportTab = () => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('all');

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
          <SupportSearch 
            requests={mockRequests}
            searchTerm={searchTerm}
            statusFilter={statusFilter}
            dateFilter={dateFilter}
            onSearchChange={setSearchTerm}
            onStatusChange={setStatusFilter}
            onDateChange={setDateFilter}
          />
          
          {filteredRequests.length > 0 ? (
            <SupportTable requests={filteredRequests} />
          ) : (
            <EmptySupport />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TrunklineSupportTab;
