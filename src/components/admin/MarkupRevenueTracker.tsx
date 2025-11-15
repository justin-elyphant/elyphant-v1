import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, DollarSign, Calendar } from 'lucide-react';

interface MarkupMetrics {
  totalAllTime: number;
  totalThisMonth: number;
  totalToday: number;
  averagePerOrder: number;
  averagePercentage: number;
  totalOrders: number;
}

export const MarkupRevenueTracker = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<MarkupMetrics | null>(null);

  const fetchMarkupMetrics = async () => {
    try {
      setLoading(true);

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

      // Get all-time metrics - extract gifting_fee from line_items jsonb
      const { data: allTimeData } = await supabase
        .from('orders')
        .select('line_items, total_amount');

      // Get this month's metrics
      const { data: monthData } = await supabase
        .from('orders')
        .select('line_items')
        .gte('created_at', startOfMonth);

      // Get today's metrics
      const { data: todayData } = await supabase
        .from('orders')
        .select('line_items')
        .gte('created_at', startOfDay);

      const extractGiftingFee = (order: any) => {
        const lineItems = order.line_items as any;
        return lineItems?.gifting_fee || 0;
      };

      const totalAllTime = allTimeData?.reduce((sum, o) => sum + extractGiftingFee(o), 0) || 0;
      const totalThisMonth = monthData?.reduce((sum, o) => sum + extractGiftingFee(o), 0) || 0;
      const totalToday = todayData?.reduce((sum, o) => sum + extractGiftingFee(o), 0) || 0;
      
      const totalOrders = allTimeData?.length || 0;
      const averagePerOrder = totalOrders > 0 ? totalAllTime / totalOrders : 0;
      
      // Calculate average markup percentage
      const avgPercentage = allTimeData?.reduce((sum, o) => {
        const giftingFee = extractGiftingFee(o);
        if (o.total_amount && o.total_amount > 0) {
          return sum + (giftingFee / o.total_amount) * 100;
        }
        return sum;
      }, 0) || 0;
      const averagePercentage = totalOrders > 0 ? avgPercentage / totalOrders : 0;

      setMetrics({
        totalAllTime,
        totalThisMonth,
        totalToday,
        averagePerOrder,
        averagePercentage,
        totalOrders
      });

    } catch (error) {
      console.error('Failed to fetch markup metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarkupMetrics();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Markup Revenue Tracking</CardTitle>
          <CardDescription>Loading revenue metrics...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Markup Revenue Tracking
        </CardTitle>
        <CardDescription>
          Real-time profit from gifting fees collected on orders
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="space-y-2 p-4 border rounded-lg bg-primary/5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span>Total Markup (All-Time)</span>
            </div>
            <div className="text-3xl font-bold text-primary">
              ${metrics.totalAllTime.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground">
              From {metrics.totalOrders.toLocaleString()} orders
            </div>
          </div>

          <div className="space-y-2 p-4 border rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>This Month</span>
            </div>
            <div className="text-3xl font-bold">
              ${metrics.totalThisMonth.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground">
              Month-to-date revenue
            </div>
          </div>

          <div className="space-y-2 p-4 border rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Today</span>
            </div>
            <div className="text-3xl font-bold">
              ${metrics.totalToday.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground">
              Daily revenue
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Average Markup per Order</div>
            <div className="text-xl font-semibold">${metrics.averagePerOrder.toFixed(2)}</div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Average Markup Percentage</div>
            <div className="text-xl font-semibold">{metrics.averagePercentage.toFixed(1)}%</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
