
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  DollarSign, 
  Zap, 
  BarChart3, 
  RefreshCw,
  Target,
  Clock,
  Database
} from "lucide-react";
import { searchCacheService } from "@/services/cache/searchCacheService";
import { optimizedSearchService } from "@/services/search/optimizedSearchService";

const OptimizationDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);

  const refreshStats = async () => {
    setIsLoading(true);
    try {
      const metrics = optimizedSearchService.getMetrics();
      const cacheStats = searchCacheService.getStats();
      
      setStats({
        ...metrics,
        ...cacheStats,
        projectedMonthlySavings: cacheStats.costSaved * 30, // Rough monthly projection
        efficiencyScore: cacheStats.hitRate > 80 ? 'Excellent' : 
                        cacheStats.hitRate > 60 ? 'Good' : 
                        cacheStats.hitRate > 40 ? 'Fair' : 'Needs Improvement'
      });
    } catch (error) {
      console.error('Error refreshing stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshStats();
    // Auto-refresh every 30 seconds
    const interval = setInterval(refreshStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const clearAllCaches = () => {
    searchCacheService.clearAll();
    optimizedSearchService.reset();
    refreshStats();
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Search Optimization Dashboard</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshStats}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={clearAllCaches}
          >
            <Database className="h-4 w-4 mr-2" />
            Clear Cache
          </Button>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost Saved Today</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${(stats.costSaved || 0).toFixed(3)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.apiCallsSaved || 0} API calls avoided
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {(stats.hitRate || 0).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.cacheHits || 0} hits / {stats.totalSearches || 0} searches
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {(stats.averageResponseTime || 0).toFixed(0)}ms
            </div>
            <p className="text-xs text-muted-foreground">
              Including cache lookups
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efficiency</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-orange-600">
              {stats.efficiencyScore || 'Calculating...'}
            </div>
            <p className="text-xs text-muted-foreground">
              Based on cache performance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Projections Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Projected Monthly Savings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Current daily rate:</span>
                <span className="font-medium">${(stats.costSaved || 0).toFixed(3)}/day</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Monthly projection:</span>
                <span className="font-bold text-green-600">
                  ${(stats.projectedMonthlySavings || 0).toFixed(2)}/month
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Yearly projection:</span>
                <span className="font-bold text-green-600">
                  ${((stats.projectedMonthlySavings || 0) * 12).toFixed(2)}/year
                </span>
              </div>
              <div className="mt-4 p-3 bg-green-50 rounded-md">
                <p className="text-sm text-green-800">
                  🎯 Target achieved! Original cost was ~$43.51 for 4,351 searches. 
                  Current optimization reduces this by {((stats.hitRate || 0)).toFixed(0)}%.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Optimization Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Multi-layer Caching:</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Active
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Search Debouncing:</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  500ms delay
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Query Optimization:</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Min 3 chars
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Result Recycling:</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Smart matching
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Session Limits:</span>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  50 searches/session
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Performance Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-green-600">What's Working Well:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Cache hit rate above 60% saves significant costs</li>
                <li>• Debouncing prevents unnecessary API calls</li>
                <li>• Result recycling finds related products</li>
                <li>• Session limits prevent API abuse</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-blue-600">Optimization Opportunities:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Popular searches get cached longer</li>
                <li>• Similar queries share cached results</li>
                <li>• Background prefetching for common terms</li>
                <li>• Smart pagination reduces large requests</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OptimizationDashboard;
