import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Users, DollarSign, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { useOrders } from "@/hooks/trunkline/useOrders";
import { useCustomers } from "@/hooks/trunkline/useCustomers";

export default function OverviewTab() {
  const { orders, loading: ordersLoading } = useOrders();
  const { customers, loading: customersLoading } = useCustomers();

  // Calculate metrics
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_amount), 0);
  const totalCustomers = customers.length;
  const pendingOrders = orders.filter(order => order.status === 'pending').length;
  const completedOrders = orders.filter(order => order.status === 'completed').length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Recent orders (last 7 days)
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  const recentOrders = orders.filter(order => new Date(order.created_at) > lastWeek);

  const metrics = [
    {
      title: "Total Orders",
      value: totalOrders.toLocaleString(),
      icon: Package,
      trend: `+${recentOrders.length} this week`,
      trendUp: true,
    },
    {
      title: "Revenue",
      value: `$${totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      trend: `$${averageOrderValue.toFixed(2)} avg order`,
      trendUp: true,
    },
    {
      title: "Customers",
      value: totalCustomers.toLocaleString(),
      icon: Users,
      trend: "Active users",
      trendUp: true,
    },
    {
      title: "Pending Orders",
      value: pendingOrders.toLocaleString(),
      icon: AlertTriangle,
      trend: "Needs attention",
      trendUp: false,
    },
  ];

  if (ordersLoading || customersLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-slate-200 rounded"></div>
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
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
        <p className="text-slate-600 mt-1">Monitor your Enhanced Zinc API System performance</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <Card key={metric.title} className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">{metric.title}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{metric.value}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className={`h-3 w-3 mr-1 ${metric.trendUp ? 'text-green-600' : 'text-orange-600'}`} />
                    <span className={`text-xs ${metric.trendUp ? 'text-green-600' : 'text-orange-600'}`}>
                      {metric.trend}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-slate-100 rounded-lg">
                  <metric.icon className="h-6 w-6 text-slate-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
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
                <span className="text-sm text-slate-600">Completed</span>
                <span className="font-medium">{completedOrders}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Pending</span>
                <span className="font-medium">{pendingOrders}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Processing</span>
                <span className="font-medium">
                  {orders.filter(order => order.status === 'processing').length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Enhanced Zinc API</span>
                <span className="text-green-600 font-medium">● Online</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Order Processing</span>
                <span className="text-green-600 font-medium">● Active</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Database</span>
                <span className="text-green-600 font-medium">● Healthy</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Order Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div>
                  <p className="font-medium text-sm">{order.order_number}</p>
                  <p className="text-xs text-slate-600">
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-sm">${Number(order.total_amount).toFixed(2)}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    order.status === 'completed' ? 'bg-green-100 text-green-700' :
                    order.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                    'bg-blue-100 text-blue-700'
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