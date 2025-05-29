
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Calendar, TrendingUp, Users, Gift } from "lucide-react";
import { ExtendedEventData } from "../types";

interface AnalyticsDashboardProps {
  events: ExtendedEventData[];
}

const AnalyticsDashboard = ({ events }: AnalyticsDashboardProps) => {
  // Generate analytics data
  const eventsByType = events.reduce((acc, event) => {
    acc[event.type] = (acc[event.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const eventTypeData = Object.entries(eventsByType).map(([type, count]) => ({
    type,
    count,
  }));

  const monthlyData = [
    { month: "Jan", events: 12, gifts: 8 },
    { month: "Feb", events: 8, gifts: 6 },
    { month: "Mar", events: 15, gifts: 12 },
    { month: "Apr", events: 10, gifts: 7 },
    { month: "May", events: 18, gifts: 15 },
    { month: "Jun", events: 14, gifts: 11 },
  ];

  const spendingData = [
    { month: "Jan", amount: 240 },
    { month: "Feb", amount: 180 },
    { month: "Mar", amount: 320 },
    { month: "Apr", amount: 220 },
    { month: "May", amount: 380 },
    { month: "Jun", amount: 290 },
  ];

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'];

  const totalEvents = events.length;
  const totalGiftsSent = Math.floor(totalEvents * 0.7); // Mock 70% gift rate
  const totalSpent = spendingData.reduce((sum, month) => sum + month.amount, 0);
  const avgGiftAmount = totalGiftsSent > 0 ? Math.round(totalSpent / totalGiftsSent) : 0;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <Calendar className="h-8 w-8 text-blue-600 mr-4" />
            <div>
              <div className="text-2xl font-bold">{totalEvents}</div>
              <p className="text-sm text-muted-foreground">Total Events</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <Gift className="h-8 w-8 text-green-600 mr-4" />
            <div>
              <div className="text-2xl font-bold">{totalGiftsSent}</div>
              <p className="text-sm text-muted-foreground">Gifts Sent</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <TrendingUp className="h-8 w-8 text-purple-600 mr-4" />
            <div>
              <div className="text-2xl font-bold">${totalSpent}</div>
              <p className="text-sm text-muted-foreground">Total Spent</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <Users className="h-8 w-8 text-orange-600 mr-4" />
            <div>
              <div className="text-2xl font-bold">${avgGiftAmount}</div>
              <p className="text-sm text-muted-foreground">Avg Gift Amount</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Events by Type */}
        <Card>
          <CardHeader>
            <CardTitle>Events by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={eventTypeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Event Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Event Type Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={eventTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {eventTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="events" fill="#8884d8" name="Events" />
                <Bar dataKey="gifts" fill="#82ca9d" name="Gifts Sent" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Spending Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Spending Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={spendingData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="amount" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Insights & Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Badge variant="default" className="mt-1">Insight</Badge>
              <div>
                <p className="font-medium">High Activity Months</p>
                <p className="text-sm text-muted-foreground">
                  May and March show the highest gift-giving activity. Consider setting higher budgets during these months.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Badge variant="secondary" className="mt-1">Tip</Badge>
              <div>
                <p className="font-medium">Auto-Gift Optimization</p>
                <p className="text-sm text-muted-foreground">
                  You're manually sending {Math.round((1 - 0.7) * 100)}% of gifts. Consider enabling auto-gift for recurring events to save time.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Badge variant="outline" className="mt-1">Recommendation</Badge>
              <div>
                <p className="font-medium">Budget Planning</p>
                <p className="text-sm text-muted-foreground">
                  Based on your spending pattern, consider setting a monthly budget of ${Math.round(totalSpent / 6)} to maintain consistent gifting.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsDashboard;
