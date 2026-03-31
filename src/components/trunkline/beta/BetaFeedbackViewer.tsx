import React, { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Star, MessageSquare, BarChart3, Users } from "lucide-react";

const FEATURE_LABELS: Record<string, string> = {
  product_search: "Product Search",
  wishlists: "Wishlists",
  gift_scheduling: "Gift Scheduling",
  checkout: "Checkout",
  auto_gifts: "Auto-Gifts",
  connections: "Connections",
  other: "Other",
};

const BetaFeedbackViewer: React.FC<{ onNewCount?: (count: number) => void }> = ({ onNewCount }) => {
  const [featureFilter, setFeatureFilter] = useState<string>("all");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [newCount, setNewCount] = useState(0);
  const queryClient = useQueryClient();

  // Real-time subscription for new feedback
  useEffect(() => {
    const channel = supabase
      .channel("beta-feedback-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "beta_feedback" },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["beta-feedback-all"] });
          setNewCount((prev) => {
            const next = prev + 1;
            onNewCount?.(next);
            return next;
          });
          toast.info("New beta feedback received!", {
            description: `A tester just submitted feedback for ${FEATURE_LABELS[(payload.new as any).feature_area] || "a feature"}.`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, onNewCount]);

  // Reset new count when component is visible
  const resetNewCount = useCallback(() => {
    setNewCount(0);
    onNewCount?.(0);
  }, [onNewCount]);

  useEffect(() => {
    resetNewCount();
  }, [resetNewCount]);

  const { data: feedback = [], isLoading } = useQuery({
    queryKey: ["beta-feedback-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("beta_feedback")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Get unique user IDs to fetch profiles
  const userIds = [...new Set(feedback.map((f: any) => f.user_id))];

  const { data: profiles = [] } = useQuery({
    queryKey: ["beta-feedback-profiles", userIds],
    queryFn: async () => {
      if (userIds.length === 0) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, email")
        .in("id", userIds);
      if (error) throw error;
      return data || [];
    },
    enabled: userIds.length > 0,
  });

  const profileMap = new Map(profiles.map((p: any) => [p.id, p]));

  // Filter
  const filtered = feedback.filter((f: any) => {
    const matchesFeature = featureFilter === "all" || f.feature_area === featureFilter;
    const matchesUser = userFilter === "all" || f.user_id === userFilter;
    return matchesFeature && matchesUser;
  });

  // Stats
  const totalSubmissions = feedback.length;
  const uniqueTesters = new Set(feedback.map((f: any) => f.user_id)).size;
  const ratedEntries = feedback.filter((f: any) => f.rating != null);
  const avgRating = ratedEntries.length > 0
    ? (ratedEntries.reduce((sum: number, f: any) => sum + f.rating, 0) / ratedEntries.length).toFixed(1)
    : "—";

  // Per-feature avg ratings
  const featureRatings = Object.keys(FEATURE_LABELS).reduce((acc, key) => {
    const entries = feedback.filter((f: any) => f.feature_area === key && f.rating != null);
    acc[key] = entries.length > 0
      ? (entries.reduce((s: number, f: any) => s + f.rating, 0) / entries.length).toFixed(1)
      : null;
    return acc;
  }, {} as Record<string, string | null>);

  if (isLoading) {
    return <p className="text-center text-muted-foreground py-12">Loading feedback...</p>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <MessageSquare className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{totalSubmissions}</p>
              <p className="text-xs text-muted-foreground">Total Entries</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Users className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{uniqueTesters}</p>
              <p className="text-xs text-muted-foreground">Testers Responded</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Star className="h-8 w-8 text-amber-400" />
            <div>
              <p className="text-2xl font-bold">{avgRating}</p>
              <p className="text-xs text-muted-foreground">Avg Rating</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Per-Feature Ratings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4" />
            Satisfaction by Feature
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(FEATURE_LABELS).filter(([k]) => k !== "other").map(([key, label]) => (
              <div key={key} className="border rounded-lg p-3">
                <p className="text-sm font-medium text-foreground">{label}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Star className={`h-4 w-4 ${featureRatings[key] ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                  <span className="text-lg font-semibold">
                    {featureRatings[key] || "—"}
                  </span>
                  <span className="text-xs text-muted-foreground">/5</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Feedback Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
          <CardTitle className="text-base">All Feedback</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by tester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Testers</SelectItem>
                {profiles.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name || p.email || "Unknown"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={featureFilter} onValueChange={setFeatureFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by feature" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Features</SelectItem>
                {Object.entries(FEATURE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No feedback yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tester</TableHead>
                  <TableHead>Feature</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((entry: any) => {
                  const profile = profileMap.get(entry.user_id);
                  return (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <p className="font-medium text-sm">{profile?.name || "Unknown"}</p>
                      </TableCell>
                      <TableCell className="text-sm">
                        {FEATURE_LABELS[entry.feature_area] || entry.feature_area}
                      </TableCell>
                      <TableCell>
                        {entry.rating ? (
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`h-3.5 w-3.5 ${
                                  s <= entry.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"
                                }`}
                              />
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[300px]">
                        <p className="text-sm text-muted-foreground truncate">
                          {entry.feedback_text || "—"}
                        </p>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(entry.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BetaFeedbackViewer;
