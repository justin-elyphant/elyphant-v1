import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, Server, Database, Zap, Settings, Target, AlertTriangle, CheckCircle } from 'lucide-react';

interface ScalingConfig {
  autoScalingEnabled: boolean;
  cpuThreshold: number;
  memoryThreshold: number;
  responseTimeThreshold: number;
  minInstances: number;
  maxInstances: number;
  scaleUpCooldown: number;
  scaleDownCooldown: number;
}

interface CapacityPrediction {
  date: string;
  predictedUsers: number;
  currentCapacity: number;
  requiredCapacity: number;
}

/**
 * TRUNKLINE SCALING MANAGEMENT
 * 
 * Advanced scaling configuration and capacity planning for 100K users.
 * 
 * Features:
 * - Auto-scaling configuration
 * - Capacity forecasting
 * - Resource optimization
 * - Performance benchmarking
 * - Load testing coordination
 */
const TrunklineScaling: React.FC = () => {
  const [scalingConfig, setScalingConfig] = useState<ScalingConfig>({
    autoScalingEnabled: true,
    cpuThreshold: 70,
    memoryThreshold: 80,
    responseTimeThreshold: 500,
    minInstances: 2,
    maxInstances: 20,
    scaleUpCooldown: 300,
    scaleDownCooldown: 600
  });

  const [loadTestActive, setLoadTestActive] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState('10k');

  const capacityData: CapacityPrediction[] = [
    { date: '2024-01', predictedUsers: 2847, currentCapacity: 10000, requiredCapacity: 3500 },
    { date: '2024-02', predictedUsers: 4200, currentCapacity: 10000, requiredCapacity: 5000 },
    { date: '2024-03', predictedUsers: 6800, currentCapacity: 15000, requiredCapacity: 8000 },
    { date: '2024-04', predictedUsers: 12000, currentCapacity: 20000, requiredCapacity: 14000 },
    { date: '2024-05', predictedUsers: 18500, currentCapacity: 25000, requiredCapacity: 22000 },
    { date: '2024-06', predictedUsers: 28000, currentCapacity: 35000, requiredCapacity: 33000 },
    { date: '2024-07', predictedUsers: 42000, currentCapacity: 50000, requiredCapacity: 48000 },
    { date: '2024-08', predictedUsers: 63000, currentCapacity: 70000, requiredCapacity: 72000 },
    { date: '2024-09', predictedUsers: 85000, currentCapacity: 90000, requiredCapacity: 95000 },
    { date: '2024-10', predictedUsers: 100000, currentCapacity: 100000, requiredCapacity: 115000 }
  ];

  const currentMetrics = {
    activeInstances: 4,
    cpuUsage: 45,
    memoryUsage: 62,
    avgResponseTime: 234,
    requestsPerSecond: 156,
    concurrentUsers: 423
  };

  const scalingTargets = [
    { id: '1k', label: '1K Users', description: 'Development load testing' },
    { id: '10k', label: '10K Users', description: 'Production milestone 1' },
    { id: '50k', label: '50K Users', description: 'Production milestone 2' },
    { id: '100k', label: '100K Users', description: 'Target capacity' }
  ];

  const updateScalingConfig = (key: keyof ScalingConfig, value: any) => {
    setScalingConfig(prev => ({ ...prev, [key]: value }));
  };

  const startLoadTest = () => {
    setLoadTestActive(true);
    // Simulate load test
    setTimeout(() => {
      setLoadTestActive(false);
    }, 30000);
  };

  const getCapacityStatus = (current: number, required: number) => {
    const ratio = current / required;
    if (ratio >= 1.2) return { status: 'optimal', color: 'text-green-600', bg: 'bg-green-50' };
    if (ratio >= 1.0) return { status: 'adequate', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { status: 'insufficient', color: 'text-red-600', bg: 'bg-red-50' };
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Scaling Management</h1>
          <p className="text-muted-foreground">Auto-scaling configuration and capacity planning</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={loadTestActive ? "destructive" : "outline"} 
            onClick={startLoadTest}
            disabled={loadTestActive}
          >
            {loadTestActive ? "Test Running..." : "Start Load Test"}
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
        </div>
      </div>

      {/* Current Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Instances</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMetrics.activeInstances}</div>
            <p className="text-xs text-muted-foreground">Active servers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMetrics.cpuUsage}%</div>
            <Progress value={currentMetrics.cpuUsage} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMetrics.memoryUsage}%</div>
            <Progress value={currentMetrics.memoryUsage} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMetrics.avgResponseTime}ms</div>
            <p className="text-xs text-muted-foreground">Avg response</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">RPS</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMetrics.requestsPerSecond}</div>
            <p className="text-xs text-muted-foreground">Requests/sec</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMetrics.concurrentUsers}</div>
            <p className="text-xs text-muted-foreground">Concurrent</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="capacity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="capacity">Capacity Planning</TabsTrigger>
          <TabsTrigger value="auto-scaling">Auto-Scaling</TabsTrigger>
          <TabsTrigger value="load-testing">Load Testing</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>

        <TabsContent value="capacity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Capacity Forecast</CardTitle>
              <CardDescription>Projected capacity needs for 100K user growth</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={capacityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="currentCapacity" 
                    stackId="1" 
                    stroke="#8884d8" 
                    fill="#8884d8" 
                    fillOpacity={0.3}
                    name="Current Capacity"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="requiredCapacity" 
                    stackId="2" 
                    stroke="#82ca9d" 
                    fill="#82ca9d" 
                    fillOpacity={0.3}
                    name="Required Capacity"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="predictedUsers" 
                    stroke="#ff7c7c" 
                    strokeWidth={2}
                    name="Predicted Users"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Capacity Analysis</CardTitle>
                <CardDescription>Current vs required capacity breakdown</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {capacityData.slice(-4).map((period) => {
                  const status = getCapacityStatus(period.currentCapacity, period.requiredCapacity);
                  return (
                    <div key={period.date} className={`p-3 rounded-lg ${status.bg}`}>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{period.date}</p>
                          <p className="text-sm text-muted-foreground">
                            {period.predictedUsers.toLocaleString()} users
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className={status.color}>
                            {status.status}
                          </Badge>
                          <p className="text-sm mt-1">
                            {period.currentCapacity.toLocaleString()} / {period.requiredCapacity.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Scaling Recommendations</CardTitle>
                <CardDescription>Proactive scaling suggestions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900">Increase Database Connections</p>
                    <p className="text-sm text-blue-700">
                      Scale up to 50 connections by March to handle 10K+ users
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-900">Edge Function Scaling</p>
                    <p className="text-sm text-yellow-700">
                      Consider dedicated regions for high-traffic areas by June
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-900">Storage Optimization</p>
                    <p className="text-sm text-green-700">
                      Current growth pattern is sustainable through 100K users
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="auto-scaling" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Auto-Scaling Configuration</CardTitle>
              <CardDescription>Configure automatic scaling thresholds and limits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Auto-Scaling</Label>
                  <div className="text-sm text-muted-foreground">
                    Automatically scale resources based on demand
                  </div>
                </div>
                <Switch
                  checked={scalingConfig.autoScalingEnabled}
                  onCheckedChange={(checked) => updateScalingConfig('autoScalingEnabled', checked)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>CPU Threshold: {scalingConfig.cpuThreshold}%</Label>
                    <Slider
                      value={[scalingConfig.cpuThreshold]}
                      onValueChange={([value]) => updateScalingConfig('cpuThreshold', value)}
                      max={100}
                      step={5}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Memory Threshold: {scalingConfig.memoryThreshold}%</Label>
                    <Slider
                      value={[scalingConfig.memoryThreshold]}
                      onValueChange={([value]) => updateScalingConfig('memoryThreshold', value)}
                      max={100}
                      step={5}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Response Time Threshold: {scalingConfig.responseTimeThreshold}ms</Label>
                    <Slider
                      value={[scalingConfig.responseTimeThreshold]}
                      onValueChange={([value]) => updateScalingConfig('responseTimeThreshold', value)}
                      min={100}
                      max={2000}
                      step={50}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="min-instances">Minimum Instances</Label>
                    <Input
                      id="min-instances"
                      type="number"
                      value={scalingConfig.minInstances}
                      onChange={(e) => updateScalingConfig('minInstances', Number(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max-instances">Maximum Instances</Label>
                    <Input
                      id="max-instances"
                      type="number"
                      value={scalingConfig.maxInstances}
                      onChange={(e) => updateScalingConfig('maxInstances', Number(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="scale-up-cooldown">Scale Up Cooldown (seconds)</Label>
                    <Input
                      id="scale-up-cooldown"
                      type="number"
                      value={scalingConfig.scaleUpCooldown}
                      onChange={(e) => updateScalingConfig('scaleUpCooldown', Number(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="scale-down-cooldown">Scale Down Cooldown (seconds)</Label>
                    <Input
                      id="scale-down-cooldown"
                      type="number"
                      value={scalingConfig.scaleDownCooldown}
                      onChange={(e) => updateScalingConfig('scaleDownCooldown', Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button>Save Configuration</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="load-testing" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Load Test Configuration</CardTitle>
                <CardDescription>Test system capacity at different user loads</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Target Load</Label>
                  <Select value={selectedTarget} onValueChange={setSelectedTarget}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {scalingTargets.map((target) => (
                        <SelectItem key={target.id} value={target.id}>
                          {target.label} - {target.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ramp Up Duration</Label>
                    <Select defaultValue="5min">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1min">1 minute</SelectItem>
                        <SelectItem value="5min">5 minutes</SelectItem>
                        <SelectItem value="10min">10 minutes</SelectItem>
                        <SelectItem value="30min">30 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Test Duration</Label>
                    <Select defaultValue="10min">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5min">5 minutes</SelectItem>
                        <SelectItem value="10min">10 minutes</SelectItem>
                        <SelectItem value="30min">30 minutes</SelectItem>
                        <SelectItem value="1hour">1 hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  onClick={startLoadTest}
                  disabled={loadTestActive}
                >
                  {loadTestActive ? "Test Running..." : "Start Load Test"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Previous Test Results</CardTitle>
                <CardDescription>Historical load test performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="font-medium">1K Users Test</p>
                      <p className="text-sm text-muted-foreground">Completed 2 hours ago</p>
                    </div>
                    <Badge variant="default">Passed</Badge>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <div>
                      <p className="font-medium">5K Users Test</p>
                      <p className="text-sm text-muted-foreground">Completed 1 day ago</p>
                    </div>
                    <Badge variant="secondary">Warning</Badge>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">10K Users Test</p>
                      <p className="text-sm text-muted-foreground">Scheduled for tomorrow</p>
                    </div>
                    <Badge variant="outline">Pending</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Optimizations</CardTitle>
                <CardDescription>Recommended improvements for better scaling</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div className="flex-1">
                      <p className="font-medium">Database Connection Pooling</p>
                      <p className="text-sm text-muted-foreground">Implemented and optimized</p>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>

                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div className="flex-1">
                      <p className="font-medium">Edge Function Caching</p>
                      <p className="text-sm text-muted-foreground">Redis caching for API responses</p>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>

                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    <div className="flex-1">
                      <p className="font-medium">CDN Optimization</p>
                      <p className="text-sm text-muted-foreground">Consider multi-region CDN setup</p>
                    </div>
                    <Badge variant="secondary">Recommended</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resource Utilization</CardTitle>
                <CardDescription>Current resource usage and efficiency</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">CPU Efficiency</span>
                    <div className="flex items-center gap-2">
                      <Progress value={85} className="w-20" />
                      <span className="text-sm">85%</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Memory Utilization</span>
                    <div className="flex items-center gap-2">
                      <Progress value={72} className="w-20" />
                      <span className="text-sm">72%</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Network Throughput</span>
                    <div className="flex items-center gap-2">
                      <Progress value={58} className="w-20" />
                      <span className="text-sm">58%</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm">Storage I/O</span>
                    <div className="flex items-center gap-2">
                      <Progress value={34} className="w-20" />
                      <span className="text-sm">34%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TrunklineScaling;