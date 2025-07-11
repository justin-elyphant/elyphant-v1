import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Filter, Calendar, DollarSign, RefreshCw } from "lucide-react";
import { OrderFilters } from "@/hooks/trunkline/useOrders";

interface OrderSearchProps {
  filters: OrderFilters;
  onFiltersChange: (filters: OrderFilters) => void;
  onRefresh: () => void;
  loading?: boolean;
}

export default function OrderSearch({ filters, onFiltersChange, onRefresh, loading }: OrderSearchProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSearchChange = (search: string) => {
    onFiltersChange({ ...filters, search });
  };

  const handleStatusChange = (status: string) => {
    onFiltersChange({ 
      ...filters, 
      status: status === "all" ? undefined : status 
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
    setShowAdvanced(false);
  };

  const hasActiveFilters = filters.search || filters.status || filters.dateRange || filters.minAmount || filters.maxAmount;

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        {/* Primary search and actions */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder="Search by order number, customer email, Zinc order ID..."
              value={filters.search || ""}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={filters.status || "all"} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
            disabled={loading}
            title="Refresh orders"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>

          <Button
            variant="outline"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </div>

        {/* Advanced filters */}
        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Date Range</label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  placeholder="From"
                  className="text-sm"
                />
                <Input
                  type="date"
                  placeholder="To"
                  className="text-sm"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Amount Range</label>
              <div className="flex gap-2">
                <div className="relative">
                  <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-400 h-3 w-3" />
                  <Input
                    type="number"
                    placeholder="Min"
                    className="pl-7 text-sm"
                    value={filters.minAmount || ""}
                    onChange={(e) => onFiltersChange({ 
                      ...filters, 
                      minAmount: e.target.value ? Number(e.target.value) : undefined 
                    })}
                  />
                </div>
                <div className="relative">
                  <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-400 h-3 w-3" />
                  <Input
                    type="number"
                    placeholder="Max"
                    className="pl-7 text-sm"
                    value={filters.maxAmount || ""}
                    onChange={(e) => onFiltersChange({ 
                      ...filters, 
                      maxAmount: e.target.value ? Number(e.target.value) : undefined 
                    })}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-end">
              <Button
                variant="ghost"
                onClick={clearFilters}
                disabled={!hasActiveFilters}
                className="text-sm"
              >
                Clear All Filters
              </Button>
            </div>
          </div>
        )}

        {/* Active filters indicator */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span className="font-medium">Active filters:</span>
            {filters.search && (
              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                Search: "{filters.search}"
              </span>
            )}
            {filters.status && (
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                Status: {filters.status}
              </span>
            )}
            {(filters.minAmount || filters.maxAmount) && (
              <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">
                Amount: ${filters.minAmount || 0} - ${filters.maxAmount || '∞'}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}