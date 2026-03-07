import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, DollarSign, Package, Clock } from "lucide-react";

const metrics = [
  { label: "Total Orders", value: "0", change: null, icon: ShoppingCart },
  { label: "Revenue", value: "$0.00", change: null, icon: DollarSign },
  { label: "Active Products", value: "0", change: null, icon: Package },
  { label: "Pending Orders", value: "0", change: null, icon: Clock },
];

const VendorDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Dashboard
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
                <p className="text-2xl font-semibold text-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {metric.value}
                </p>
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
