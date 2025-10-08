import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Mail, 
  TrendingUp, 
  Eye, 
  MousePointer, 
  AlertTriangle, 
  Search,
  Download,
  Filter,
  BarChart3
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EmailAnalytics {
  id: string;
  template_type: string;
  recipient_email: string;
  sent_at: string;
  opened_at: string | null;
  clicked_at: string | null;
  bounced_at: string | null;
  delivery_status: string;
  resend_message_id: string | null;
}

interface AnalyticsStats {
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
}

interface TemplateStats {
  template_type: string;
  sent: number;
  opened: number;
  clicked: number;
  bounced: number;
  open_rate: number;
  click_rate: number;
}

const EmailAnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState<EmailAnalytics[]>([]);
  const [templateStats, setTemplateStats] = useState<TemplateStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [templateFilter, setTemplateFilter] = useState("all");
  const [dateRange, setDateRange] = useState("7");

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      const days = parseInt(dateRange);
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);

      const { data: analyticsData, error: analyticsError } = await supabase
        .from('email_analytics')
        .select('*')
        .gte('sent_at', fromDate.toISOString())
        .order('sent_at', { ascending: false });

      if (analyticsError) throw analyticsError;

      setAnalytics(analyticsData || []);
      calculateTemplateStats(analyticsData || []);
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load email analytics');
    } finally {
      setLoading(false);
    }
  };

  const calculateTemplateStats = (data: EmailAnalytics[]) => {
    const statsMap = new Map<string, TemplateStats>();

    data.forEach(email => {
      const type = email.template_type;
      if (!statsMap.has(type)) {
        statsMap.set(type, {
          template_type: type,
          sent: 0,
          opened: 0,
          clicked: 0,
          bounced: 0,
          open_rate: 0,
          click_rate: 0
        });
      }

      const stats = statsMap.get(type)!;
      stats.sent++;
      if (email.opened_at) stats.opened++;
      if (email.clicked_at) stats.clicked++;
      if (email.bounced_at) stats.bounced++;
    });

    const templateStatsArray = Array.from(statsMap.values()).map(stats => ({
      ...stats,
      open_rate: stats.sent > 0 ? (stats.opened / stats.sent) * 100 : 0,
      click_rate: stats.sent > 0 ? (stats.clicked / stats.sent) * 100 : 0
    }));

    setTemplateStats(templateStatsArray);
  };

  const getOverallStats = (): AnalyticsStats => {
    const totalSent = analytics.length;
    const totalOpened = analytics.filter(a => a.opened_at).length;
    const totalClicked = analytics.filter(a => a.clicked_at).length;
    const totalBounced = analytics.filter(a => a.bounced_at).length;

    return {
      totalSent,
      totalOpened,
      totalClicked,
      totalBounced,
      openRate: totalSent > 0 ? (totalOpened / totalSent) * 100 : 0,
      clickRate: totalSent > 0 ? (totalClicked / totalSent) * 100 : 0,
      bounceRate: totalSent > 0 ? (totalBounced / totalSent) * 100 : 0
    };
  };

  const filteredAnalytics = analytics.filter(email => {
    const matchesSearch = email.recipient_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         email.template_type.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || email.delivery_status === statusFilter;
    const matchesTemplate = templateFilter === "all" || email.template_type === templateFilter;
    
    return matchesSearch && matchesStatus && matchesTemplate;
  });

  const stats = getOverallStats();
  const uniqueTemplateTypes = [...new Set(analytics.map(a => a.template_type))];

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-slate-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Email Analytics</h1>
          <p className="text-slate-600">Monitor email performance and engagement metrics</p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Last 24h</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Emails sent in the last {dateRange} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalOpened} emails opened
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clickRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalClicked} emails clicked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.bounceRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalBounced} emails bounced
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="templates">By Template</TabsTrigger>
          <TabsTrigger value="recent">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance Overview
              </CardTitle>
              <CardDescription>
                Email engagement metrics over the selected time period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-slate-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Chart visualization coming soon</p>
                <p className="text-sm">Will show trends for opens, clicks, and bounces over time</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Template Performance</CardTitle>
              <CardDescription>
                Compare performance metrics across different email templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {templateStats.map((template) => (
                  <div key={template.template_type} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <h3 className="font-semibold">{template.template_type.replace('_', ' ').toUpperCase()}</h3>
                        <p className="text-sm text-slate-600">{template.sent} emails sent</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline">
                          {template.open_rate.toFixed(1)}% opens
                        </Badge>
                        <Badge variant="outline">
                          {template.click_rate.toFixed(1)}% clicks
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-slate-600">Sent:</span> {template.sent}
                      </div>
                      <div>
                        <span className="text-slate-600">Opened:</span> {template.opened}
                      </div>
                      <div>
                        <span className="text-slate-600">Clicked:</span> {template.clicked}
                      </div>
                      <div>
                        <span className="text-slate-600">Bounced:</span> {template.bounced}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Email Activity</CardTitle>
              <CardDescription>
                Latest email sends and their delivery status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    placeholder="Search emails..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="opened">Opened</SelectItem>
                    <SelectItem value="clicked">Clicked</SelectItem>
                    <SelectItem value="bounced">Bounced</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={templateFilter} onValueChange={setTemplateFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Templates</SelectItem>
                  {uniqueTemplateTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredAnalytics.map((email) => (
                  <div key={email.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-slate-50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{email.recipient_email}</span>
                        <Badge variant="outline" className="text-xs">
                          {email.template_type}
                        </Badge>
                      </div>
                      <div className="text-sm text-slate-600">
                        Sent: {new Date(email.sent_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {email.delivery_status === 'bounced' && (
                        <Badge variant="destructive">Bounced</Badge>
                      )}
                      {email.clicked_at && (
                        <Badge variant="default">Clicked</Badge>
                      )}
                      {email.opened_at && !email.clicked_at && (
                        <Badge variant="secondary">Opened</Badge>
                      )}
                      {!email.opened_at && !email.bounced_at && (
                        <Badge variant="outline">Sent</Badge>
                      )}
                    </div>
                  </div>
                ))}
                
                {filteredAnalytics.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    No email activity found matching your filters
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmailAnalyticsDashboard;