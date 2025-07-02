import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const OrdersContent = () => {
  const [activeTab, setActiveTab] = useState("current");

  // Mock data - in a real app, these would come from your data source
  const currentOrders = [];
  const pastOrders = [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
        <p className="text-gray-600 mt-2">
          Track your current and past orders
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="current">
            Current Orders
            <Badge variant="secondary" className="ml-2">
              {currentOrders.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="past">
            Past Orders
            <Badge variant="secondary" className="ml-2">
              {pastOrders.length}
            </Badge>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="current" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {currentOrders.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No current orders</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {currentOrders.map((order, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">Order #{order.id}</h3>
                          <p className="text-sm text-gray-600">Placed on {order.date}</p>
                        </div>
                        <Badge variant={order.status === 'shipped' ? 'default' : 'secondary'}>
                          {order.status}
                        </Badge>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm">{order.items} items</p>
                        <p className="font-semibold">${order.total}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="past" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Past Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {pastOrders.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No past orders</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pastOrders.map((order, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">Order #{order.id}</h3>
                          <p className="text-sm text-gray-600">Delivered on {order.deliveredDate}</p>
                        </div>
                        <Badge variant="outline">
                          Delivered
                        </Badge>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm">{order.items} items</p>
                        <p className="font-semibold">${order.total}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrdersContent;
