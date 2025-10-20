
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Users, Eye, Mail, Calendar, Package } from "lucide-react";
import { useCustomers } from "@/hooks/trunkline/useCustomers";
import CustomerDetailModal from "./customers/CustomerDetailModal";

const TrunklineCustomersTab = () => {
  const { customers, loading, error, filters, setFilters } = useCustomers();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const handleSearchChange = (search: string) => {
    setFilters({ ...filters, search });
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-red-600">Error loading customers: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Customer Management</h1>
        <p className="text-slate-600 mt-1">
          Manage customer profiles and view order history
        </p>
      </div>

      {/* Search and filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder="Search customers by name or email..."
                value={filters.search || ""}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Customers table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Customers ({customers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No customers found</h3>
              <p className="text-slate-600">No customers match your current search.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Profile Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer.id} className="cursor-pointer hover:bg-slate-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center">
                            <span className="text-sm font-medium">
                              {customer.name?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">
                              {customer.name || 'Unknown'}
                            </div>
                            {customer.username && (
                              <div className="text-sm text-slate-600">
                                @{customer.username}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 text-slate-400" />
                          {customer.email || 'No email'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          <span className="text-sm">
                            {customer.created_at ? 
                              new Date(customer.created_at).toLocaleDateString() : 
                              'Unknown'
                            }
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {customer.user_type || 'shopper'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={customer.onboarding_completed ? "default" : "secondary"}
                          className={customer.onboarding_completed ? 
                            "bg-green-100 text-green-800" : 
                            "bg-orange-100 text-orange-800"
                          }
                        >
                          {customer.onboarding_completed ? 'Active' : 'Pending'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedCustomerId(customer.id)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => console.log('View orders for:', customer.id)}
                          >
                            <Package className="h-3 w-3 mr-1" />
                            Orders
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <CustomerDetailModal
        customerId={selectedCustomerId}
        isOpen={!!selectedCustomerId}
        onClose={() => setSelectedCustomerId(null)}
      />
    </div>
  );
};

export default TrunklineCustomersTab;
