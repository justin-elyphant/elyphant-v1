import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";
import { 
  Mail, 
  MousePointer, 
  UserPlus, 
  Users, 
  Gift, 
  TrendingUp,
  Award,
  Target,
  Heart
} from "lucide-react";
import { useInvitationAnalytics } from "@/services/analytics/invitationAnalyticsService";
import { useAuth } from "@/contexts/auth";
import { RELATIONSHIP_CATEGORIES } from "@/config/relationshipTypes";

const InvitationAnalyticsDashboard = () => {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState([]);
  const [funnelData, setFunnelData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { getUserInvitationAnalytics, getConversionFunnel } = useInvitationAnalytics();

  React.useEffect(() => {
    const loadAnalytics = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const [invitationsData, funnelData] = await Promise.all([
          getUserInvitationAnalytics(),
          getConversionFunnel()
        ]);
        
        setInvitations(invitationsData);
        setFunnelData(funnelData);
      } catch (error) {
        console.error('Error loading analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalytics();
  }, [user]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  const funnelSteps = funnelData?.funnel ? [
    { name: 'Sent', value: funnelData.funnel.sent.count, rate: funnelData.funnel.sent.rate, icon: Mail },
    { name: 'Opened', value: funnelData.funnel.opened.count, rate: funnelData.funnel.opened.rate, icon: MousePointer },
    { name: 'Clicked', value: funnelData.funnel.clicked.count, rate: funnelData.funnel.clicked.rate, icon: Target },
    { name: 'Signed Up', value: funnelData.funnel.signed_up.count, rate: funnelData.funnel.signed_up.rate, icon: UserPlus },
    { name: 'Profile Complete', value: funnelData.funnel.profile_completed.count, rate: funnelData.funnel.profile_completed.rate, icon: Users },
    { name: 'Auto-Gift Active', value: funnelData.funnel.auto_gift_active.count, rate: funnelData.funnel.auto_gift_active.rate, icon: Gift }
  ] : [];

  const conversionColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Invitation Analytics</h1>
          <p className="text-muted-foreground">
            Track your gift invitation performance and conversion rates
          </p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          {invitations.length} Total Invitations
        </Badge>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Invitations Sent</p>
                <p className="text-2xl font-bold">{funnelData?.funnel?.sent?.count || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Sign-ups</p>
                <p className="text-2xl font-bold">{funnelData?.funnel?.signed_up?.count || 0}</p>
                <p className="text-xs text-green-600">
                  {funnelData?.funnel?.signed_up?.rate?.toFixed(1) || 0}% conversion
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Auto-Gifts Active</p>
                <p className="text-2xl font-bold">{funnelData?.funnel?.auto_gift_active?.count || 0}</p>
                <p className="text-xs text-purple-600">
                  {funnelData?.funnel?.auto_gift_active?.rate?.toFixed(1) || 0}% of signups
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Overall Conversion</p>
                <p className="text-2xl font-bold">
                  {funnelData?.total > 0 ? 
                    ((funnelData.funnel.auto_gift_active.count / funnelData.total) * 100).toFixed(1) : 0}%
                </p>
                <p className="text-xs text-orange-600">End-to-end success</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="funnel" className="space-y-4">
        <TabsList>
          <TabsTrigger value="funnel">Conversion Funnel</TabsTrigger>
          <TabsTrigger value="invitations">Invitation History</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="funnel" className="space-y-4">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Conversion Funnel</h3>
              <p className="text-sm text-muted-foreground">
                Track how invitations convert through each step
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Funnel Bar Chart */}
                <div>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={funnelSteps}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Funnel Steps */}
                <div className="space-y-3">
                  {funnelSteps.map((step, index) => {
                    const Icon = step.icon;
                    return (
                      <div key={step.name} className="flex items-center gap-3 p-3 border rounded-lg">
                        <Icon className="w-5 h-5" style={{ color: conversionColors[index] }} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{step.name}</span>
                            <span className="text-sm text-muted-foreground">
                              {step.value} ({step.rate.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2 mt-1">
                            <div 
                              className="h-2 rounded-full" 
                              style={{ 
                                width: `${step.rate}%`, 
                                backgroundColor: conversionColors[index] 
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invitations" className="space-y-4">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Recent Invitations</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {invitations.slice(0, 10).map((invitation: any) => (
                  <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{invitation.recipient_name}</p>
                      <p className="text-sm text-muted-foreground">{invitation.recipient_email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {invitation.relationship_type}
                        </Badge>
                        {invitation.occasion && (
                          <Badge variant="outline" className="text-xs">
                            {invitation.occasion}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={
                        invitation.conversion_status === 'auto_gift_active' ? 'default' :
                        invitation.conversion_status === 'profile_completed' ? 'secondary' :
                        invitation.conversion_status === 'signed_up' ? 'outline' : 'destructive'
                      }>
                        {invitation.conversion_status.replace('_', ' ')}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(invitation.invitation_sent_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          {/* Relationship Conversion Chart */}
          {funnelData?.byRelationship && funnelData.byRelationship.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-primary" />
                  Conversion by Relationship Type
                </CardTitle>
                <CardDescription>
                  See how different relationships impact invitation conversion rates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={funnelData.byRelationship}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="category" 
                        angle={-45} 
                        textAnchor="end" 
                        height={80}
                        tickFormatter={(value) => {
                          const category = Object.values(RELATIONSHIP_CATEGORIES).find(
                            c => c.label.toLowerCase().includes(value)
                          );
                          return category?.label.split(' - ')[0] || value;
                        }}
                      />
                      <YAxis label={{ value: 'Conversion %', angle: -90, position: 'insideLeft' }} />
                      <Tooltip 
                        formatter={(value: any) => [`${value.toFixed(1)}%`, 'Conversion Rate']}
                        labelFormatter={(label) => {
                          const category = Object.values(RELATIONSHIP_CATEGORIES).find(
                            c => c.label.toLowerCase().includes(label)
                          );
                          return category?.label || label;
                        }}
                      />
                      <Bar dataKey="conversionRate" fill="#8b5cf6" />
                    </BarChart>
                  </ResponsiveContainer>
                  
                  <div className="space-y-3">
                    {funnelData.byRelationship
                      .sort((a: any, b: any) => b.conversionRate - a.conversionRate)
                      .map((stat: any, index: number) => (
                        <div key={stat.category} className="flex items-center gap-3 p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium capitalize">{stat.category.replace('_', ' ')}</span>
                              <span className="text-sm font-semibold text-primary">
                                {stat.conversionRate.toFixed(1)}%
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{stat.converted}/{stat.total} converted</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2 mt-2">
                              <div 
                                className="h-2 rounded-full bg-primary" 
                                style={{ width: `${stat.conversionRate}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Performance Insights</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                {funnelData?.byRelationship && funnelData.byRelationship.length > 0 && (
                  <div className="flex items-center gap-3">
                    <Award className="w-5 h-5 text-yellow-500" />
                    <div>
                      <p className="font-medium">Best Converting Relationship</p>
                      <p className="text-sm text-muted-foreground">
                        {(() => {
                          const best = funnelData.byRelationship.reduce((prev: any, curr: any) => 
                            curr.conversionRate > prev.conversionRate ? curr : prev
                          );
                          return `${best.category.replace('_', ' ')} (${best.conversionRate.toFixed(1)}%)`;
                        })()}
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="font-medium">Optimal Timing</p>
                    <p className="text-sm text-muted-foreground">
                      Invitations sent 2-3 weeks before occasions perform best
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="font-medium">Improvement Opportunity</p>
                    <p className="text-sm text-muted-foreground">
                      Follow-up reminders can increase conversion by 15%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Recommendations</h3>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">
                    💡 Add personal touches to invitations
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Mention shared memories or specific occasions
                  </p>
                </div>
                
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-medium text-green-800">
                    🎯 Target family events first
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Family invitations have higher conversion rates
                  </p>
                </div>

                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-sm font-medium text-purple-800">
                    📅 Send birthday invitations early
                  </p>
                  <p className="text-xs text-purple-600 mt-1">
                    2-3 weeks gives recipients time to set preferences
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InvitationAnalyticsDashboard;