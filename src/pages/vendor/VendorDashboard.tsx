import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, DollarSign, Package, Clock, Loader2 } from "lucide-react";
import { useVendorOrderStats } from "@/hooks/vendor/useVendorOrders";
import { useVendorAccount } from "@/hooks/vendor/useVendorAccount";

const VendorDashboard: React.FC = () => {
  const { data: account, isLoading: accountLoading } = useVendorAccount();
  const { data: stats, isLoading: statsLoading } = useVendorOrderStats();

  const isLoading = accountLoading || statsLoading;

  const metrics = [
    { label: "Total Orders", value: stats?.totalOrders ?? 0, icon: ShoppingCart, format: (v: number) => String(v) },
    { label: "Revenue", value: stats?.totalRevenue ?? 0, icon: DollarSign, format: (v: number) => `$${v.toFixed(2)}` },
    { label: "Active Products", value: 0, icon: Package, format: (v: number) => String(v) },
    { label: "Pending Orders", value: stats?.pendingOrders ?? 0, icon: Clock, format: (v: number) => String(v) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {account?.company_name ? `${account.company_name} Dashboard` : "Dashboard"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of your vendor account performance.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {metric.label}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : (
                  <p className="text-2xl font-semibold text-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {metric.format(metric.value)}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-10 w-10 text-muted-foreground/40 mb-3" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground">No recent activity yet.</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Orders and product updates will appear here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorDashboard;
