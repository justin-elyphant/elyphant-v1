
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, MessageSquare } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SupportRequest } from "./types";

interface SupportSearchProps {
  requests: SupportRequest[];
  searchTerm: string;
  statusFilter: string;
  dateFilter: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onDateChange: (value: string) => void;
}

const SupportSearch: React.FC<SupportSearchProps> = ({ 
  requests, 
  searchTerm, 
  statusFilter, 
  dateFilter,
  onSearchChange,
  onStatusChange,
  onDateChange
}) => {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input 
          type="search" 
          placeholder="Search by order ID, customer, or subject..." 
          className="pl-8" 
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      
      <Select value={statusFilter} onValueChange={onStatusChange}>
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
      
      <Select value={dateFilter} onValueChange={onDateChange}>
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
  );
};

export default SupportSearch;
