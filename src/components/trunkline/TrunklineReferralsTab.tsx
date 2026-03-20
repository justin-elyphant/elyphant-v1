import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Gift, DollarSign, Users, Clock } from "lucide-react";

interface BetaReferral {
  id: string;
  referrer_id: string;
  referred_id: string | null;
  referred_email: string;
  status: string;
  reward_amount: number;
  reward_paid_at: string | null;
  reward_notes: string | null;
  created_at: string;
  referrer_profile?: { name: string | null; email: string | null };
  referred_profile?: { name: string | null; email: string | null };
}

const TrunklineReferralsTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const { data: referrals = [], isLoading } = useQuery({
    queryKey: ["beta-referrals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("beta_referrals")
        .select(`
          *,
          referrer_profile:profiles!beta_referrals_referrer_id_fkey(name, email),
          referred_profile:profiles!beta_referrals_referred_id_fkey(name, email)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as BetaReferral[];
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { error } = await supabase
        .from("beta_referrals")
        .update({
          status: "reward_paid",
          reward_paid_at: new Date().toISOString(),
          reward_notes: notes || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["beta-referrals"] });
      toast.success("Referral marked as paid");
      setMarkingId(null);
      setNotes("");
    },
    onError: () => toast.error("Failed to update referral"),
  });

  const totalReferrals = referrals.length;
  const pendingRewards = referrals.filter((r) => r.status === "signed_up").length;
  const totalPaid = referrals
    .filter((r) => r.status === "reward_paid")
    .reduce((sum, r) => sum + (r.reward_amount || 0), 0);

  const statusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "signed_up":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Signed Up</Badge>;
      case "reward_paid":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Paid</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Beta Referrals</h1>
        <p className="text-muted-foreground">Track invite-driven signups and $100 reward payouts.</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Users className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{totalReferrals}</p>
              <p className="text-xs text-muted-foreground">Total Referrals</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Clock className="h-8 w-8 text-amber-500" />
            <div>
              <p className="text-2xl font-bold">{pendingRewards}</p>
              <p className="text-xs text-muted-foreground">Pending Rewards</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <DollarSign className="h-8 w-8 text-emerald-500" />
            <div>
              <p className="text-2xl font-bold">${totalPaid.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Paid Out</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referrals Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            All Referrals
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Loading referrals…</p>
          ) : referrals.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No referrals yet. Invite links will populate this table automatically.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Referrer</TableHead>
                  <TableHead>Referred</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referrals.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{r.referrer_profile?.name || "—"}</p>
                        <p className="text-xs text-muted-foreground">{r.referrer_profile?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{r.referred_profile?.name || r.referred_email}</p>
                        <p className="text-xs text-muted-foreground">{r.referred_profile?.email || r.referred_email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(r.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{statusBadge(r.status)}</TableCell>
                    <TableCell className="font-medium">${r.reward_amount}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {r.reward_notes || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {r.status === "signed_up" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setMarkingId(r.id);
                            setNotes("");
                          }}
                        >
                          Mark Paid
                        </Button>
                      )}
                      {r.status === "reward_paid" && r.reward_paid_at && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(r.reward_paid_at).toLocaleDateString()}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Mark as Paid Dialog */}
      <Dialog open={!!markingId} onOpenChange={() => setMarkingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Reward as Paid</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Optional notes (e.g., Paid via Venmo, PayPal ref #123)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarkingId(null)}>Cancel</Button>
            <Button
              onClick={() => markingId && markPaidMutation.mutate({ id: markingId, notes })}
              disabled={markPaidMutation.isPending}
            >
              {markPaidMutation.isPending ? "Saving…" : "Confirm Paid ($100)"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrunklineReferralsTab;
