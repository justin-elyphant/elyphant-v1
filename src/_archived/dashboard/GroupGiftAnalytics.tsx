import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Users, DollarSign, Gift, Target, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface AnalyticsData {
  totalContributed: number;
  totalReceived: number;
  activeProjects: number;
  completedProjects: number;
  averageContribution: number;
  participationRate: number;
  monthlyTrend: number;
  popularCategories: { category: string; count: number; amount: number }[];
}

const GroupGiftAnalytics = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalContributed: 0,
    totalReceived: 0,
    activeProjects: 0,
    completedProjects: 0,
    averageContribution: 0,
    participationRate: 0,
    monthlyTrend: 0,
    popularCategories: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  const fetchAnalytics = async () => {
    try {
      // Fetch group gift contributions made by user
      const { data: contributions, error: contributionsError } = await supabase
        .from('group_gift_contributions')
        .select(`
          *,
          group_gift_projects(
            target_amount,
            status,
            created_at,
            target_product_name
          )
        `)
        .eq('contributor_id', user?.id);

      if (contributionsError) throw contributionsError;

      // Fetch projects where user is coordinator or recipient
      const { data: projects, error: projectsError } = await supabase
        .from('group_gift_projects')
        .select('*')
        .or(`coordinator_id.eq.${user?.id},recipient_id.eq.${user?.id}`);

      if (projectsError) throw projectsError;

      // Calculate analytics
      const totalContributed = contributions?.reduce((sum, c) => sum + (c.paid_amount || c.committed_amount), 0) || 0;
      const totalReceived = projects?.filter(p => p.recipient_id === user?.id && p.status === 'delivered')
        .reduce((sum, p) => sum + (p.current_amount || 0), 0) || 0;
      
      const activeProjects = projects?.filter(p => p.status === 'collecting' || p.status === 'ready_to_purchase').length || 0;
      const completedProjects = projects?.filter(p => p.status === 'delivered').length || 0;
      
      const averageContribution = contributions?.length 
        ? totalContributed / contributions.length 
        : 0;

      // Calculate monthly trend (simplified)
      const currentMonth = new Date().getMonth();
      const thisMonthContributions = contributions?.filter(c => 
        new Date(c.created_at || '').getMonth() === currentMonth
      ) || [];
      const lastMonthContributions = contributions?.filter(c => 
        new Date(c.created_at || '').getMonth() === currentMonth - 1
      ) || [];
      
      const monthlyTrend = lastMonthContributions.length > 0 
        ? ((thisMonthContributions.length - lastMonthContributions.length) / lastMonthContributions.length) * 100
        : 0;

      // Popular categories (simplified based on product names)
      const categoryMap = new Map();
      contributions?.forEach(c => {
        if (c.group_gift_projects?.target_product_name) {
          const category = c.group_gift_projects.target_product_name.split(' ')[0]; // Simple categorization
          const existing = categoryMap.get(category) || { count: 0, amount: 0 };
          categoryMap.set(category, {
            count: existing.count + 1,
            amount: existing.amount + (c.paid_amount || c.committed_amount)
          });
        }
      });

      const popularCategories = Array.from(categoryMap.entries())
        .map(([category, data]) => ({ category, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      setAnalytics({
        totalContributed,
        totalReceived,
        activeProjects,
        completedProjects,
        averageContribution,
        participationRate: 85, // Placeholder calculation
        monthlyTrend,
        popularCategories
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Group Gift Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Group Gift Analytics
        </CardTitle>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate('/analytics')}
          className="text-muted-foreground hover:text-foreground"
        >
          View Details
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              <span>Contributed</span>
            </div>
            <div className="text-xl font-bold text-green-600">
              {formatCurrency(analytics.totalContributed)}
            </div>
          </div>
          
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
              <Gift className="h-4 w-4" />
              <span>Received</span>
            </div>
            <div className="text-xl font-bold text-blue-600">
              {formatCurrency(analytics.totalReceived)}
            </div>
          </div>
          
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
              <Users className="h-4 w-4" />
              <span>Active</span>
            </div>
            <div className="text-xl font-bold text-orange-600">
              {analytics.activeProjects}
            </div>
          </div>
          
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
              <Target className="h-4 w-4" />
              <span>Completed</span>
            </div>
            <div className="text-xl font-bold text-purple-600">
              {analytics.completedProjects}
            </div>
          </div>
        </div>

        {/* Trends */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <span className="text-sm text-muted-foreground">Average Contribution</span>
            <div className="text-right">
              <div className="font-medium">{formatCurrency(analytics.averageContribution)}</div>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <span className="text-sm text-muted-foreground">Monthly Trend</span>
            <div className="flex items-center gap-2">
              {analytics.monthlyTrend >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <span className={`font-medium ${analytics.monthlyTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(analytics.monthlyTrend).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Popular Categories */}
        {analytics.popularCategories.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Popular Categories</h4>
            <div className="space-y-2">
              {analytics.popularCategories.map((category, index) => (
                <div key={category.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      #{index + 1}
                    </Badge>
                    <span className="text-sm">{category.category}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{formatCurrency(category.amount)}</div>
                    <div className="text-xs text-muted-foreground">{category.count} gifts</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GroupGiftAnalytics;