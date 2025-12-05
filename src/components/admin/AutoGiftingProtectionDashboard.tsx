/**
 * Admin dashboard for monitoring auto-gifting protection measures and system health
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { protectedAutoGiftingService } from '@/services/protected-auto-gifting-service';
import { useAuth } from '@/contexts/auth';
import { toast } from 'sonner';
import { 
  Shield, 
  DollarSign, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Users,
  TrendingUp,
  Zap,
  RefreshCw
} from 'lucide-react';

interface ProtectionStats {
  rateLimit: {
    activeUsers: number;
    totalExecutionsToday: number;
    maxExecutionsPerDay: number;
    maxApiCallsPerDay: number;
  };
  budget: {
    totalBudget: number;
    autoGiftingAllocation: number;
    manualSearchAllocation: number;
    reservedForPriority: number;
    currentSpent: number;
    percentUsed: string;
  };
  optimization: any;
  cache: any;
  emergencyCircuitBreakerActive: boolean;
}

export const AutoGiftingProtectionDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<ProtectionStats | null>(null);
  const [userRateLimit, setUserRateLimit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async () => {
    try {
      const protectionStats = protectedAutoGiftingService.getServiceStatistics();
      const userStatus = user ? protectedAutoGiftingService.getUserRateLimitStatus(user.id) : null;
      
      setStats(protectionStats);
      setUserRateLimit(userStatus);
    } catch (error) {
      console.error('Error loading protection stats:', error);
      toast.error('Failed to load protection statistics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStats();
  };

  const handleResetMonthly = async () => {
    try {
      protectedAutoGiftingService.resetMonthlyTracking();
      toast.success('Monthly tracking reset successfully');
      await loadStats();
    } catch (error) {
      toast.error('Failed to reset monthly tracking');
    }
  };

  useEffect(() => {
    loadStats();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">Failed to load protection statistics</p>
      </div>
    );
  }

  const budgetPercentUsed = parseFloat(stats.budget.percentUsed.replace('%', ''));
  const isEmergencyActive = stats.emergencyCircuitBreakerActive;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Auto-Gifting Protection Dashboard</h2>
          <p className="text-muted-foreground">Monitor system health and protective measures</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetMonthly}
            className="text-orange-600 border-orange-200"
          >
            Reset Monthly
          </Button>
        </div>
      </div>

      {/* Emergency Status */}
      {isEmergencyActive && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <CardTitle className="text-red-700">Emergency Circuit Breaker Active</CardTitle>
            </div>
            <CardDescription className="text-red-600">
              Auto-gifting has been temporarily disabled due to budget limits
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="budget">Budget & Costs</TabsTrigger>
          <TabsTrigger value="rate-limits">Rate Limits</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.rateLimit.activeUsers}</div>
                <p className="text-xs text-muted-foreground">
                  Using auto-gifting today
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Budget Used</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.budget.percentUsed}</div>
                <Progress value={budgetPercentUsed} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  ${stats.budget.currentSpent} of ${stats.budget.totalBudget}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Executions Today</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.rateLimit.totalExecutionsToday}</div>
                <p className="text-xs text-muted-foreground">
                  Across all users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Status</CardTitle>
                {isEmergencyActive ? (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
              </CardHeader>
              <CardContent>
                <Badge variant={isEmergencyActive ? "destructive" : "default"}>
                  {isEmergencyActive ? 'Emergency Mode' : 'Operational'}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  Protection systems active
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="budget" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Budget Allocation</CardTitle>
                <CardDescription>How the API budget is distributed</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Auto-Gifting</span>
                    <span>${stats.budget.autoGiftingAllocation}</span>
                  </div>
                  <Progress value={(stats.budget.autoGiftingAllocation / stats.budget.totalBudget) * 100} />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Manual Search</span>
                    <span>${stats.budget.manualSearchAllocation}</span>
                  </div>
                  <Progress value={(stats.budget.manualSearchAllocation / stats.budget.totalBudget) * 100} />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Priority Reserve</span>
                    <span>${stats.budget.reservedForPriority}</span>
                  </div>
                  <Progress value={(stats.budget.reservedForPriority / stats.budget.totalBudget) * 100} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current Usage</CardTitle>
                <CardDescription>Monthly budget consumption</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">
                  ${stats.budget.currentSpent}
                </div>
                <div className="text-sm text-muted-foreground mb-4">
                  of ${stats.budget.totalBudget} monthly budget
                </div>
                <Progress 
                  value={budgetPercentUsed} 
                  className={budgetPercentUsed > 90 ? "bg-red-100" : budgetPercentUsed > 75 ? "bg-yellow-100" : ""}
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rate-limits" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>System Rate Limits</CardTitle>
                <CardDescription>Global protection thresholds</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Max Executions/User/Day</span>
                  <Badge variant="outline">{stats.rateLimit.maxExecutionsPerDay}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Max API Calls/User/Day</span>
                  <Badge variant="outline">{stats.rateLimit.maxApiCallsPerDay}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Active Users</span>
                  <Badge variant="outline">{stats.rateLimit.activeUsers}</Badge>
                </div>
              </CardContent>
            </Card>

            {userRateLimit && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Rate Limit Status</CardTitle>
                  <CardDescription>Current user limits and usage</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Executions Used</span>
                      <span>{userRateLimit.executionsUsed}/{userRateLimit.executionsUsed + userRateLimit.executionsRemaining}</span>
                    </div>
                    <Progress value={(userRateLimit.executionsUsed / (userRateLimit.executionsUsed + userRateLimit.executionsRemaining)) * 100} />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>API Calls Used</span>
                      <span>{userRateLimit.apiCallsUsed}/{userRateLimit.apiCallsUsed + userRateLimit.apiCallsRemaining}</span>
                    </div>
                    <Progress value={(userRateLimit.apiCallsUsed / (userRateLimit.apiCallsUsed + userRateLimit.apiCallsRemaining)) * 100} />
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Resets at: {new Date(userRateLimit.resetsAt).toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.optimization && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>API Calls Saved</CardTitle>
                    <CardDescription>Through caching and optimization</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.optimization.totalApiCallsSaved || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This month
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Cost Saved</CardTitle>
                    <CardDescription>Money saved through optimization</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.optimization.totalCostSaved || '$0.00'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This month
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Projected Savings</CardTitle>
                    <CardDescription>Estimated monthly savings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.optimization.estimatedMonthlySavings || '$0.00'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      If current trend continues
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {stats.cache && (
            <Card>
              <CardHeader>
                <CardTitle>Cache Performance</CardTitle>
                <CardDescription>Search result caching statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold">{stats.cache.size || 0}</div>
                    <div className="text-xs text-muted-foreground">Cache Entries</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold">{stats.cache.hits || 0}</div>
                    <div className="text-xs text-muted-foreground">Cache Hits</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold">{stats.cache.misses || 0}</div>
                    <div className="text-xs text-muted-foreground">Cache Misses</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold">
                      {stats.cache.hits && stats.cache.misses ? 
                        `${Math.round((stats.cache.hits / (stats.cache.hits + stats.cache.misses)) * 100)}%` : 
                        '0%'
                      }
                    </div>
                    <div className="text-xs text-muted-foreground">Hit Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};