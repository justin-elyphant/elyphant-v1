
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, CreditCard, TrendingUp } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import EmptyVendorsState from "./EmptyVendorsState";

const PayoutsContent: React.FC = () => {
  // Mock vendor credit data
  const vendorCredits = [
    { id: 'v1', name: 'Fashion Outlet', availableCredits: 50, purchasedCredits: 75, usedCredits: 25, lastPurchase: '2023-04-10' },
    { id: 'v2', name: 'Home Goods', availableCredits: 15, purchasedCredits: 30, usedCredits: 15, lastPurchase: '2023-04-05' },
    { id: 'v3', name: 'Shopify Store A', availableCredits: 0, purchasedCredits: 0, usedCredits: 0, lastPurchase: null }
  ];

  if (vendorCredits.length === 0) {
    return (
      <EmptyVendorsState 
        icon={<DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />}
        message="Vendor credit information will appear here once vendors start using the platform."
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="h-5 w-5 mr-2 text-primary" />
            Vendor Credit Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor Name</TableHead>
                <TableHead>Available Credits</TableHead>
                <TableHead>Total Purchased</TableHead>
                <TableHead>Used Credits</TableHead>
                <TableHead>Last Purchase</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendorCredits.map((vendor) => (
                <TableRow key={vendor.id}>
                  <TableCell className="font-medium">{vendor.name}</TableCell>
                  <TableCell>{vendor.availableCredits}</TableCell>
                  <TableCell>{vendor.purchasedCredits}</TableCell>
                  <TableCell>{vendor.usedCredits}</TableCell>
                  <TableCell>{vendor.lastPurchase ? new Date(vendor.lastPurchase).toLocaleDateString() : "Never"}</TableCell>
                  <TableCell>
                    {vendor.availableCredits > 0 ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">No Credits</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-primary" />
            Advertising Credit Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground mb-4">
            Track vendor advertising credit usage and sponsored product performance.
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>Sponsored Products</TableHead>
                <TableHead>Credits Used (This Month)</TableHead>
                <TableHead>Impression Boost</TableHead>
                <TableHead>Conversion Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Fashion Outlet</TableCell>
                <TableCell>3</TableCell>
                <TableCell>15</TableCell>
                <TableCell>+125%</TableCell>
                <TableCell>4.2%</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Home Goods</TableCell>
                <TableCell>1</TableCell>
                <TableCell>5</TableCell>
                <TableCell>+75%</TableCell>
                <TableCell>3.7%</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default PayoutsContent;
