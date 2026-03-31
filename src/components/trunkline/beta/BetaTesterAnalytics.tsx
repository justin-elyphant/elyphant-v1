import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  useBetaTesterAnalytics,
  FunnelData,
} from "@/hooks/trunkline/useBetaTesterAnalytics";
import { ShoppingBag } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import {
  Activity, TrendingUp, Users, Percent, CheckCircle2, Circle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const FUNNEL_STEPS: { key: keyof FunnelData; label: string }[] = [
  { key: "signed_up", label: "Signed Up" },
  { key: "built_wishlist", label: "Built Wishlist" },
  { key: "invited_friend", label: "Invited Friend" },
  { key: "scheduled_gift", label: "Scheduled Gift" },
  { key: "made_purchase", label: "Made Purchase" },
];

const FUNNEL_COLORS = [
  "hsl(var(--primary))",
  "hsl(220, 70%, 55%)",
  "hsl(250, 60%, 55%)",
  "hsl(280, 55%, 55%)",
  "hsl(160, 60%, 45%)",
];

const StepDot = ({ completed }: { completed: boolean }) => (
  completed
    ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
    : <Circle className="h-4 w-4 text-muted-foreground/30" />
);

const BetaTesterAnalytics: React.FC = () => {
  const { data, isLoading, error } = useBetaTesterAnalytics();

  if (isLoading) {
    return <p className="text-center text-muted-foreground py-12">Loading analytics...</p>;
  }

  if (error || !data) {
    return <p className="text-center text-muted-foreground py-12">Failed to load analytics.</p>;
  }

  const { funnel, engagement, feature_usage, per_tester } = data;
  const total = funnel.signed_up || 1;
  const totalOrders = (per_tester || []).reduce((sum, t) => sum + (t.order_count || 0), 0);

  const funnelChartData = FUNNEL_STEPS.map((step) => ({
    name: step.label,
    count: funnel[step.key],
    pct: Math.round((funnel[step.key] / total) * 100),
  }));

  const featureChartData = (feature_usage || []).slice(0, 10).map((f) => ({
    name: f.feature.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    count: f.usage_count,
    users: f.unique_users,
  }));

  return (
    <div className="space-y-6">
      {/* Engagement Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <TrendingUp className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{Number(engagement.avg_orders_per_tester).toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">Avg Orders / Tester</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Percent className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{Number(engagement.credit_utilization_pct).toFixed(0)}%</p>
              <p className="text-xs text-muted-foreground">Credit Utilization</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Activity className="h-8 w-8 text-emerald-500" />
            <div>
              <p className="text-2xl font-bold">{engagement.active_last_7_days}</p>
              <p className="text-xs text-muted-foreground">Active Last 7 Days</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Users className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{engagement.total_testers}</p>
              <p className="text-xs text-muted-foreground">Total Testers</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activation Funnel */}
      <Card>
        <CardHeader>
          <CardTitle>Activation Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          {funnel.signed_up === 0 ? (
            <p className="text-center text-muted-foreground py-8">No testers yet.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelChartData} layout="vertical" margin={{ left: 20, right: 40 }}>
                  <XAxis type="number" domain={[0, total]} hide />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 13 }} />
                  <Tooltip
                    formatter={(value: number, _name: string, props: any) =>
                      [`${value} (${props.payload.pct}%)`, "Testers"]
                    }
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={28}>
                    {funnelChartData.map((_, i) => (
                      <Cell key={i} fill={FUNNEL_COLORS[i]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feature Adoption */}
      {featureChartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Feature Adoption (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={featureChartData} layout="vertical" margin={{ left: 20, right: 40 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number, _name: string, props: any) =>
                      [`${value} events (${props.payload.users} users)`, "Usage"]
                    }
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} barSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Per-Tester Activity */}
      {per_tester && per_tester.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Per-Tester Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tester</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead className="text-center">Wishlists</TableHead>
                  <TableHead className="text-center">Orders</TableHead>
                  <TableHead className="text-center">Features</TableHead>
                  <TableHead className="text-center">Onboarding Steps</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {per_tester.map((t) => (
                  <TableRow key={t.user_id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{t.name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{t.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {t.last_active ? (
                        <span className="text-muted-foreground">
                          {formatDistanceToNow(new Date(t.last_active), { addSuffix: true })}
                        </span>
                      ) : (
                        <Badge variant="outline" className="text-xs">Never</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center font-medium">{t.wishlist_count}</TableCell>
                    <TableCell className="text-center font-medium">{t.order_count}</TableCell>
                    <TableCell className="text-center font-medium">{t.features_used}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 justify-center">
                        <StepDot completed={t.has_wishlist} />
                        <StepDot completed={t.has_invited} />
                        <StepDot completed={t.has_scheduled_gift} />
                        <StepDot completed={t.has_purchased} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Wishlist</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Invited</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Scheduled</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Purchased</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BetaTesterAnalytics;
