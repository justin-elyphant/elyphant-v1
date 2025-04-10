
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  Bar,
  LineChart,
  Line
} from "recharts";

const VendorAnalyticsTab = () => {
  // Sample data for the charts
  const performanceData = [
    { name: 'Jan', views: 40, clicks: 24, purchases: 10 },
    { name: 'Feb', views: 55, clicks: 31, purchases: 15 },
    { name: 'Mar', views: 68, clicks: 38, purchases: 18 },
    { name: 'Apr', views: 81, clicks: 45, purchases: 20 },
    { name: 'May', views: 90, clicks: 52, purchases: 24 },
    { name: 'Jun', views: 95, clicks: 58, purchases: 28 },
  ];
  
  const conversionData = [
    { name: 'Jan', rate: 4.2 },
    { name: 'Feb', rate: 4.8 },
    { name: 'Mar', rate: 5.1 },
    { name: 'Apr', rate: 5.5 },
    { name: 'May', rate: 5.9 },
    { name: 'Jun', rate: 6.2 },
  ];
  
  const productPerformanceData = [
    { name: 'Product A', views: 180, clicks: 95, purchases: 42 },
    { name: 'Product B', views: 150, clicks: 85, purchases: 38 },
    { name: 'Product C', views: 120, clicks: 70, purchases: 32 },
    { name: 'Product D', views: 90, clicks: 45, purchases: 20 },
    { name: 'Product E', views: 80, clicks: 40, purchases: 18 },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Performance Overview</CardTitle>
          <CardDescription>View key metrics for your products</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm font-medium text-muted-foreground">Total Views</div>
                <div className="text-3xl font-bold">429</div>
                <div className="text-xs text-green-600 mt-1">+12% from last month</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm font-medium text-muted-foreground">Conversion Rate</div>
                <div className="text-3xl font-bold">5.7%</div>
                <div className="text-xs text-green-600 mt-1">+0.3% from last month</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm font-medium text-muted-foreground">Total Sales</div>
                <div className="text-3xl font-bold">$3,892</div>
                <div className="text-xs text-green-600 mt-1">+8% from last month</div>
              </CardContent>
            </Card>
          </div>
          
          <Tabs defaultValue="performance">
            <TabsList>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="conversion">Conversion</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
            </TabsList>
            
            <TabsContent value="performance" className="mt-4">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="views" fill="#8884d8" name="Views" />
                    <Bar dataKey="clicks" fill="#82ca9d" name="Clicks" />
                    <Bar dataKey="purchases" fill="#ffc658" name="Purchases" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            
            <TabsContent value="conversion" className="mt-4">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={conversionData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value}%`, 'Conversion Rate']} />
                    <Legend />
                    <Line type="monotone" dataKey="rate" stroke="#8884d8" activeDot={{ r: 8 }} name="Conversion Rate %" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            
            <TabsContent value="products" className="mt-4">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={productPerformanceData}
                    layout="vertical"
                  >
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="views" fill="#8884d8" name="Views" />
                    <Bar dataKey="clicks" fill="#82ca9d" name="Clicks" />
                    <Bar dataKey="purchases" fill="#ffc658" name="Purchases" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Product Performance</CardTitle>
          <CardDescription>Detailed metrics for individual products</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-dashed p-8 text-center">
            <p className="text-muted-foreground">
              No product performance data available yet. This section will show detailed metrics
              once you have products with activity.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorAnalyticsTab;
