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
import { Badge } from "@/components/ui/badge";

const STAGE_LABELS: Record<string, string> = {
  first_impressions: "First Impressions",
  explorer: "Explorer",
  engaged: "Engaged",
  activated: "Activated",
  power_user: "Power User",
};

const STAGE_COLORS: Record<string, string> = {
  first_impressions: "bg-blue-100 text-blue-800",
  explorer: "bg-amber-100 text-amber-800",
  engaged: "bg-emerald-100 text-emerald-800",
  activated: "bg-purple-100 text-purple-800",
  power_user: "bg-red-100 text-red-800",
};

const BetaFeedbackViewer: React.FC<{ onNewCount?: (count: number) => void }> = ({ onNewCount }) => {
  const [featureFilter, setFeatureFilter] = useState<string>("all");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [stageFilter, setStageFilter] = useState<string>("all");
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
            description: `A tester just submitted feedback for ${(payload.new as any).feature_area || "a feature"}.`,
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

  // Load all stage questions for label lookup
  const { data: stageQuestions = [] } = useQuery({
    queryKey: ["beta-feedback-stage-questions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("beta_feedback_stages")
        .select("feature_area, label")
        .order("sort_order");
      if (error) throw error;
      return data || [];
    },
  });

  const featureLabelMap = new Map(stageQuestions.map((q: any) => [q.feature_area, q.label]));
  const getFeatureLabel = (key: string) => featureLabelMap.get(key) || key;

  const profileMap = new Map(profiles.map((p: any) => [p.id, p]));

  // Filter
  const filtered = feedback.filter((f: any) => {
    const matchesFeature = featureFilter === "all" || f.feature_area === featureFilter;
    const matchesUser = userFilter === "all" || f.user_id === userFilter;
    const matchesStage = stageFilter === "all" || f.feedback_stage === stageFilter;
    return matchesFeature && matchesUser && matchesStage;
  });

  // Stats
  const totalSubmissions = feedback.length;
  const uniqueTesters = new Set(feedback.map((f: any) => f.user_id)).size;
  const ratedEntries = feedback.filter((f: any) => f.rating != null);
  const avgRating = ratedEntries.length > 0
    ? (ratedEntries.reduce((sum: number, f: any) => sum + f.rating, 0) / ratedEntries.length).toFixed(1)
    : "—";

  // Unique feature areas in feedback for filter dropdown
  const uniqueFeatures = [...new Set(feedback.map((f: any) => f.feature_area))];

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

      {/* Feedback Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            All Feedback
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filter by stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {Object.entries(STAGE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger className="w-[160px]">
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
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filter by feature" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Features</SelectItem>
                {uniqueFeatures.map((key: string) => (
                  <SelectItem key={key} value={key}>{getFeatureLabel(key)}</SelectItem>
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
                  <TableHead>Stage</TableHead>
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
                      <TableCell>
                        {entry.feedback_stage ? (
                          <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${STAGE_COLORS[entry.feedback_stage] || "bg-muted text-muted-foreground"}`}>
                            {STAGE_LABELS[entry.feedback_stage] || entry.feedback_stage}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {getFeatureLabel(entry.feature_area)}
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
