
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line } from "recharts";

const AdvertisingDashboard = () => {
  // Simulated advertising performance data
  const performanceData = [
    { name: "Week 1", impressions: 5240, clicks: 420, conversions: 28 },
    { name: "Week 2", impressions: 6120, clicks: 510, conversions: 32 },
    { name: "Week 3", impressions: 7840, clicks: 620, conversions: 45 },
    { name: "Week 4", impressions: 8450, clicks: 680, conversions: 52 },
  ];
  
  // Simulated ad placements data
  const placementData = [
    { name: "Featured Banner", value: 45 },
    { name: "Product Listings", value: 30 },
    { name: "Search Results", value: 15 },
    { name: "Category Pages", value: 10 },
  ];
  
  const adConfig = {
    impressions: { label: "Impressions", color: "hsl(var(--primary))" },
    clicks: { label: "Clicks", color: "hsl(var(--cyan-600))" },
    conversions: { label: "Conversions", color: "hsl(var(--green-600))" },
  };
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Ad Impressions</CardTitle>
            <CardDescription>Total views across all campaigns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">27,650</div>
            <p className="text-sm text-green-600 flex items-center mt-1">
              +12.5% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Conversion Rate</CardTitle>
            <CardDescription>Percent of clicks resulting in sales</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">7.8%</div>
            <p className="text-sm text-green-600 flex items-center mt-1">
              +1.2% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Ad Revenue</CardTitle>
            <CardDescription>Total revenue from advertising</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">$4,280</div>
            <p className="text-sm text-green-600 flex items-center mt-1">
              +8.3% from last month
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Advertising Performance</CardTitle>
          <CardDescription>Track impressions, clicks, and conversions</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={adConfig} className="h-80">
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="impressions"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="clicks"
                stroke="hsl(198, 93%, 60%)"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="conversions"
                stroke="hsl(142, 71%, 45%)"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Ad Placement Performance</CardTitle>
            <CardDescription>Effectiveness by placement location</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={placementData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Create New Campaign</CardTitle>
            <CardDescription>Set up a new advertising campaign</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Create a new advertising campaign to promote your products 
              or boost visibility for specific vendors.
            </p>
            <div className="space-y-2">
              <div className="bg-muted/50 p-3 rounded-md flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Featured Banner</h4>
                  <p className="text-xs text-muted-foreground">Prime visibility on marketplace homepage</p>
                </div>
                <Button size="sm">Select</Button>
              </div>
              
              <div className="bg-muted/50 p-3 rounded-md flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Product Sponsorship</h4>
                  <p className="text-xs text-muted-foreground">Promote products in search results</p>
                </div>
                <Button size="sm">Select</Button>
              </div>
              
              <div className="bg-muted/50 p-3 rounded-md flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Vendor Spotlight</h4>
                  <p className="text-xs text-muted-foreground">Featured vendor on category pages</p>
                </div>
                <Button size="sm">Select</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdvertisingDashboard;
