import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  DollarSign, 
  Package, 
  Calendar, 
  TrendingUp, 
  AlertTriangle,
  MessageSquare,
  Phone,
  Mail,
  ExternalLink
} from "lucide-react";
import { useCustomerAnalytics, CustomerAnalytics } from "@/hooks/trunkline/useCustomerAnalytics";
import { useCustomers } from "@/hooks/trunkline/useCustomers";

interface CustomerDetailModalProps {
  customerId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function CustomerDetailModal({ customerId, isOpen, onClose }: CustomerDetailModalProps) {
  const { getCustomerAnalytics, loading: analyticsLoading } = useCustomerAnalytics();
  const { getCustomerOrderHistory } = useCustomers();
  const [customer, setCustomer] = useState<any>(null);
  const [analytics, setAnalytics] = useState<CustomerAnalytics | null>(null);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    if (customerId && isOpen) {
      loadCustomerData();
    }
  }, [customerId, isOpen]);

  const loadCustomerData = async () => {
    if (!customerId) return;
    
    try {
      // Load analytics
      const analyticsData = await getCustomerAnalytics(customerId);
      setAnalytics(analyticsData);
      
      // Load order history
      const orderHistory = await getCustomerOrderHistory(customerId);
      setOrders(orderHistory);
    } catch (error) {
      console.error('Error loading customer data:', error);
    }
  };

  const getRiskBadge = (riskLevel: string) => {
    const variants = {
      low: "bg-green-100 text-green-800",
      medium: "bg-orange-100 text-orange-800", 
      high: "bg-red-100 text-red-800"
    };
    
    return (
      <Badge className={variants[riskLevel as keyof typeof variants]}>
        {riskLevel.toUpperCase()} RISK
      </Badge>
    );
  };

  if (!customerId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            360° Customer View
          </DialogTitle>
        </DialogHeader>

        {analyticsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-slate-100 rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Customer Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-sm text-slate-600">Total Orders</p>
                      <p className="text-lg font-bold">{analytics?.totalOrders || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-sm text-slate-600">Total Spent</p>
                      <p className="text-lg font-bold">${analytics?.totalSpent.toFixed(2) || '0.00'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                    <div>
                      <p className="text-sm text-slate-600">Avg Order Value</p>
                      <p className="text-lg font-bold">${analytics?.averageOrderValue.toFixed(2) || '0.00'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <div>
                      <p className="text-sm text-slate-600">Risk Level</p>
                      <div className="mt-1">
                        {analytics && getRiskBadge(analytics.riskLevel)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Customer Details & Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-slate-600">Lifetime Value</p>
                    <p className="text-xl font-bold text-green-600">
                      ${analytics?.lifetimeValue.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <p className="text-sm text-slate-600 mb-2">Preferred Categories</p>
                    <div className="flex flex-wrap gap-2">
                      {analytics?.preferredCategories.map((category, index) => (
                        <Badge key={index} variant="outline">{category}</Badge>
                      ))}
                    </div>
                  </div>

                  {analytics?.lastOrderDate && (
                    <>
                      <Separator />
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <div>
                          <p className="text-sm text-slate-600">Last Order</p>
                          <p className="font-medium">
                            {new Date(analytics.lastOrderDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Phone className="h-4 w-4 mr-2" />
                    Schedule Call
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Mail className="h-4 w-4 mr-2" />
                    Email Customer
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Full Profile
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Order History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                      <div>
                        <p className="font-medium">{order.order_number}</p>
                        <p className="text-sm text-slate-600">
                          {new Date(order.created_at).toLocaleDateString()} • {order.order_items?.length || 0} items
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${Number(order.total_amount).toFixed(2)}</p>
                        <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}