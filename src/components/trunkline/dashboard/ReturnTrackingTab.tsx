import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Package, TrendingDown, RefreshCw, Calendar } from "lucide-react";
import { useOrders } from "@/hooks/trunkline/useOrders";

export default function ReturnTrackingTab() {
  const { orders, loading, refetch } = useOrders();

  // Calculate return metrics
  const returnedOrders = orders.filter(order => order.status === 'returned');
  const totalOrders = orders.length;
  const returnRate = totalOrders > 0 ? (returnedOrders.length / totalOrders) * 100 : 0;
  
  // Recent returns (last 7 days)
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  const recentReturns = returnedOrders.filter(order => 
    new Date(order.updated_at) > lastWeek
  );

  const metrics = [
    {
      title: "Total Returns",
      value: returnedOrders.length.toString(),
      icon: Package,
      trend: `${recentReturns.length} this week`,
      trendUp: false,
    },
    {
      title: "Return Rate",
      value: `${returnRate.toFixed(1)}%`,
      icon: TrendingDown,
      trend: returnRate > 5 ? "Above average" : "Normal range",
      trendUp: returnRate <= 5,
    },
    {
      title: "Processing",
      value: returnedOrders.filter(o => o.status === 'processing').length.toString(),
      icon: AlertTriangle,
      trend: "Needs attention",
      trendUp: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Return Tracking & Analytics</h1>
          <p className="text-slate-600 mt-1">Monitor returns via Enhanced Zinc API System</p>
        </div>
        <Button 
          onClick={refetch} 
          disabled={loading}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {metrics.map((metric) => (
          <Card key={metric.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">{metric.title}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{metric.value}</p>
                  <div className="flex items-center mt-2">
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

      {/* Return Detection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Return Detection System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="font-medium text-green-800">Active Monitoring</span>
              </div>
              <p className="text-sm text-green-700">
                Background polling is active and monitoring Zinc API for return status changes.
              </p>
            </div>
            
            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg">
              <p className="font-medium mb-1">How Return Detection Works:</p>
              <ul className="space-y-1">
                <li>• Automatic polling of Zinc API for order status changes</li>
                <li>• Detection of return indicators in Amazon order data</li>
                <li>• Real-time notifications when returns are detected</li>
                <li>• Automatic order status updates and refund tracking</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Returns Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Returns</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : returnedOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No Returns Detected</h3>
              <p className="text-slate-600">No returned orders found in the system.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {returnedOrders.slice(0, 10).map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium">{order.order_number}</p>
                      <p className="text-sm text-slate-600">
                        Zinc ID: {order.zinc_order_id || 'N/A'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      <span className="text-sm text-slate-600">
                        {new Date(order.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${Number(order.total_amount).toFixed(2)}</p>
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      Returned
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}