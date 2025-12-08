import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Users, DollarSign, TrendingUp, AlertTriangle, CheckCircle, Percent, PiggyBank, Crown, Handshake } from "lucide-react";
import { useOrders } from "@/hooks/trunkline/useOrders";
import { useCustomers } from "@/hooks/trunkline/useCustomers";

// Helper to extract gifting fee from line_items JSONB (stored in cents)
const extractGiftingFee = (lineItems: any): number => {
  if (!lineItems) return 0;
  
  // Handle different JSONB structures
  if (typeof lineItems === 'object') {
    // Direct gifting_fee property (in cents)
    if (lineItems.gifting_fee !== undefined) {
      return Number(lineItems.gifting_fee) / 100;
    }
    // Array of items with gifting_fee
    if (Array.isArray(lineItems)) {
      return lineItems.reduce((sum, item) => {
        if (item?.gifting_fee !== undefined) {
          return sum + Number(item.gifting_fee) / 100;
        }
        return sum;
      }, 0);
    }
  }
  return 0;
};

// Status categories for revenue calculation
const COMPLETED_STATUSES = ['completed', 'shipped', 'delivered'];
const PENDING_STATUSES = ['scheduled', 'pending', 'processing'];
const EXCLUDED_STATUSES = ['failed', 'cancelled'];

export default function OverviewTab() {
  const { orders, loading: ordersLoading } = useOrders();
  const { customers, loading: customersLoading } = useCustomers();

  // Filter orders by status category
  const completedOrders = orders.filter(order => COMPLETED_STATUSES.includes(order.status));
  const pendingOrders = orders.filter(order => PENDING_STATUSES.includes(order.status));
  const failedOrders = orders.filter(order => EXCLUDED_STATUSES.includes(order.status));

  // Calculate GMV (Gross Merchandise Value) - completed orders only
  const gmv = completedOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
  const pendingGmv = pendingOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);

  // Calculate Net Revenue (Elyphant Gifting Fees) - completed orders only
  const netRevenue = completedOrders.reduce((sum, order) => {
    return sum + extractGiftingFee(order.line_items);
  }, 0);
  const pendingNetRevenue = pendingOrders.reduce((sum, order) => {
    return sum + extractGiftingFee(order.line_items);
  }, 0);

  // Zinc fulfillment cost ($1.00 per order)
  const ZINC_FEE_PER_ORDER = 1.00;
  const zincCosts = completedOrders.length * ZINC_FEE_PER_ORDER;

  // Gross Profit = Net Revenue - Zinc Costs
  const grossProfit = netRevenue - zincCosts;

  // Calculate rates
  const takeRate = gmv > 0 ? (netRevenue / gmv) * 100 : 0;
  const grossMargin = netRevenue > 0 ? (grossProfit / netRevenue) * 100 : 0;

  // Total customers and orders
  const totalOrders = orders.length - failedOrders.length;
  const totalCustomers = customers.length;

  // Recent orders (last 7 days)
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  const recentOrders = orders.filter(order => 
    new Date(order.created_at) > lastWeek && !EXCLUDED_STATUSES.includes(order.status)
  );

  const metrics = [
    {
      title: "Net Revenue",
      value: `$${netRevenue.toFixed(2)}`,
      icon: DollarSign,
      trend: pendingNetRevenue > 0 ? `+$${pendingNetRevenue.toFixed(2)} pending` : "Elyphant fees earned",
      trendUp: true,
      description: "Your actual income (gifting fees)",
    },
    {
      title: "GMV",
      value: `$${gmv.toFixed(2)}`,
      icon: TrendingUp,
      trend: pendingGmv > 0 ? `+$${pendingGmv.toFixed(2)} pending` : "Total order value",
      trendUp: true,
      description: "Gross Merchandise Value",
    },
    {
      title: "Gross Profit",
      value: `$${grossProfit.toFixed(2)}`,
      icon: PiggyBank,
      trend: `${grossMargin.toFixed(1)}% margin`,
      trendUp: grossProfit > 0,
      description: "After Zinc fulfillment costs",
    },
    {
      title: "Take Rate",
      value: `${takeRate.toFixed(1)}%`,
      icon: Percent,
      trend: `${completedOrders.length} fulfilled orders`,
      trendUp: takeRate > 0,
      description: "Net Revenue / GMV",
    },
  ];

  if (ordersLoading || customersLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-1">Revenue metrics following marketplace accounting standards</p>
      </div>

      {/* Revenue Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <Card key={metric.title} className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{metric.value}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className={`h-3 w-3 mr-1 ${metric.trendUp ? 'text-green-600' : 'text-orange-600'}`} />
                    <span className={`text-xs ${metric.trendUp ? 'text-green-600' : 'text-orange-600'}`}>
                      {metric.trend}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <metric.icon className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold text-foreground mt-1">{totalOrders}</p>
                <span className="text-xs text-muted-foreground">+{recentOrders.length} this week</span>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Customers</p>
                <p className="text-2xl font-bold text-foreground mt-1">{totalCustomers}</p>
                <span className="text-xs text-muted-foreground">Active users</span>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Orders</p>
                <p className="text-2xl font-bold text-foreground mt-1">{pendingOrders.length}</p>
                <span className="text-xs text-orange-600">Needs attention</span>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Order Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Completed/Shipped/Delivered</span>
                <span className="font-medium text-green-600">{completedOrders.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Pending/Processing/Scheduled</span>
                <span className="font-medium text-orange-600">{pendingOrders.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Failed/Cancelled</span>
                <span className="font-medium text-red-600">{failedOrders.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Revenue Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Net Revenue (Fees)</span>
                <span className="font-medium text-green-600">${netRevenue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Zinc Fulfillment Costs</span>
                <span className="font-medium text-red-600">-${zincCosts.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center border-t pt-2">
                <span className="text-sm font-medium text-foreground">Gross Profit</span>
                <span className="font-bold text-foreground">${grossProfit.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Future Revenue Streams */}
      <Card className="border-dashed border-2">
        <CardHeader>
          <CardTitle className="text-muted-foreground">Future Revenue Streams</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Subscription Revenue */}
            <div className="p-4 rounded-lg bg-muted/30 border border-dashed">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Crown className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Subscription Revenue</p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">Coming Soon</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Recurring revenue from Elyphant Pro/Premium memberships
              </p>
            </div>

            {/* Retailer Commissions */}
            <div className="p-4 rounded-lg bg-muted/30 border border-dashed">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-full bg-sky-100 flex items-center justify-center">
                  <Handshake className="h-5 w-5 text-sky-600" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Retailer Commissions</p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 text-sky-700">Coming Soon</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Earned commissions from brand partnerships
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Order Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="font-medium text-sm text-foreground">{order.order_number}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-sm text-foreground">${Number(order.total_amount).toFixed(2)}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    COMPLETED_STATUSES.includes(order.status) ? 'bg-green-100 text-green-700' :
                    PENDING_STATUSES.includes(order.status) ? 'bg-orange-100 text-orange-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
