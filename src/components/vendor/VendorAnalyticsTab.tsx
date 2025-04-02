
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const VendorAnalyticsTab = () => {
  // Sample data for the chart
  const data = [
    { name: "Jan", sales: 400 },
    { name: "Feb", sales: 300 },
    { name: "Mar", sales: 600 },
    { name: "Apr", sales: 800 },
    { name: "May", sales: 500 },
    { name: "Jun", sales: 700 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vendor Analytics</CardTitle>
        <CardDescription>Performance metrics and insights</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Monthly Sales Performance</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={data}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#8884d8" 
                  activeDot={{ r: 8 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <h4 className="text-sm font-medium text-muted-foreground">Total Sales</h4>
              <p className="text-2xl font-bold">$3,300</p>
            </CardContent>
          </Card>
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <h4 className="text-sm font-medium text-muted-foreground">Conversion Rate</h4>
              <p className="text-2xl font-bold">24.8%</p>
            </CardContent>
          </Card>
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <h4 className="text-sm font-medium text-muted-foreground">Avg. Order Value</h4>
              <p className="text-2xl font-bold">$48.75</p>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};

export default VendorAnalyticsTab;
