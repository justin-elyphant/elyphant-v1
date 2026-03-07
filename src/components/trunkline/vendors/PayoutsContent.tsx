
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, CreditCard, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import EmptyVendorsState from "./EmptyVendorsState";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface VendorPayoutSummary {
  vendor_account_id: string;
  company_name: string;
  total_orders: number;
  total_revenue: number;
  total_payout: number;
  pending_orders: number;
}

const PayoutsContent: React.FC = () => {
  const { data: payoutSummaries = [], isLoading } = useQuery({
    queryKey: ["trunkline-vendor-payouts"],
    queryFn: async (): Promise<VendorPayoutSummary[]> => {
      // Get all vendor accounts
      const { data: vendors, error: vendorsError } = await supabase
        .from("vendor_accounts")
        .select("id, company_name")
        .eq("approval_status", "approved");

      if (vendorsError) throw vendorsError;
      if (!vendors?.length) return [];

      // Get all vendor orders
      const { data: orders, error: ordersError } = await supabase
        .from("vendor_orders")
        .select("vendor_account_id, status, total_amount, vendor_payout");

      if (ordersError) throw ordersError;

      // Aggregate by vendor
      return vendors.map((vendor) => {
        const vendorOrders = (orders ?? []).filter(
          (o) => o.vendor_account_id === vendor.id
        );
        return {
          vendor_account_id: vendor.id,
          company_name: vendor.company_name,
          total_orders: vendorOrders.length,
          total_revenue: vendorOrders.reduce((s, o) => s + Number(o.total_amount), 0),
          total_payout: vendorOrders.reduce((s, o) => s + Number(o.vendor_payout), 0),
          pending_orders: vendorOrders.filter((o) => o.status === "pending").length,
        };
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (payoutSummaries.length === 0) {
    return (
      <EmptyVendorsState
        icon={<DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />}
        message="No approved vendors with payout data yet."
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="h-5 w-5 mr-2 text-primary" />
            Vendor Payout Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>Total Orders</TableHead>
                <TableHead>Pending</TableHead>
                <TableHead>Total Revenue</TableHead>
                <TableHead>Vendor Payout</TableHead>
                <TableHead>Platform Fee</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payoutSummaries.map((summary) => (
                <TableRow key={summary.vendor_account_id}>
                  <TableCell className="font-medium">{summary.company_name}</TableCell>
                  <TableCell>{summary.total_orders}</TableCell>
                  <TableCell>
                    {summary.pending_orders > 0 ? (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        {summary.pending_orders}
                      </Badge>
                    ) : (
                      "0"
                    )}
                  </TableCell>
                  <TableCell>${summary.total_revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell>${summary.total_payout.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell className="text-muted-foreground">
                    ${(summary.total_revenue - summary.total_payout).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default PayoutsContent;
