import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Gift, DollarSign, Users, Clock, CheckCircle, XCircle, CreditCard, ChevronDown, ChevronUp, Mail, Send, ShieldAlert, Plus, RefreshCw } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import BetaTesterAnalytics from "@/components/trunkline/beta/BetaTesterAnalytics";
import BetaFeedbackViewer from "@/components/trunkline/beta/BetaFeedbackViewer";

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

interface BetaCredit {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  description: string | null;
  order_id: string | null;
  created_at: string;
}

interface TesterBalance {
  userId: string;
  name: string;
  email: string;
  issued: number;
  spent: number;
  remaining: number;
  orderCount: number;
}

const TrunklineReferralsTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [feedbackNewCount, setFeedbackNewCount] = useState(0);
  const [rejectNotes, setRejectNotes] = useState("");
  const [expandedTester, setExpandedTester] = useState<string | null>(null);
  const [issueCreditOpen, setIssueCreditOpen] = useState(false);
  const [creditEmail, setCreditEmail] = useState("");
  const [creditAmount, setCreditAmount] = useState("100");
  const [creditDescription, setCreditDescription] = useState("");
  const [creditFirstName, setCreditFirstName] = useState("");
  const [creditLastName, setCreditLastName] = useState("");
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [checkinEmail, setCheckinEmail] = useState("");
  const [sendingCheckin, setSendingCheckin] = useState(false);
  const [grantInvitesOpen, setGrantInvitesOpen] = useState(false);
  const [grantEmail, setGrantEmail] = useState("");
  const [grantCount, setGrantCount] = useState("2");
  const [reloadPoolOpen, setReloadPoolOpen] = useState(false);
  const [newPoolSize, setNewPoolSize] = useState("");

  // Fetch referrals
  const { data: referrals = [], isLoading: loadingReferrals } = useQuery({
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

  // Fetch all credits for tester balances
  const { data: allCredits = [] } = useQuery({
    queryKey: ["beta-credits-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("beta_credits")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as BetaCredit[];
    },
  });

  // Fetch global program settings
  const { data: programSettings } = useQuery({
    queryKey: ["beta-program-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("beta_program_settings" as any)
        .select("*")
        .eq("id", 1)
        .single();
      if (error) throw error;
      return data as any as { total_credit_pool: number };
    },
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async (referralId: string) => {
      const { data, error } = await supabase.rpc("approve_beta_referral", {
        p_referral_id: referralId,
      });
      if (error) throw error;
      const result = data as any;
      if (!result?.success) throw new Error(result?.error || "Approval failed");

      // Fire beta_approved email
      const referral = referrals.find(r => r.id === referralId);
      if (referral?.referred_profile?.email) {
        await supabase.functions.invoke("ecommerce-email-orchestrator", {
          body: {
            eventType: "beta_approved",
            recipientEmail: referral.referred_profile.email,
            data: {
              recipient_name: referral.referred_profile.name || referral.referred_email,
              credit_amount: referral.reward_amount,
            },
          },
        });
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["beta-referrals"] });
      queryClient.invalidateQueries({ queryKey: ["beta-credits-all"] });
      toast.success("Beta tester approved — $100 credit issued");
    },
    onError: (err: any) => toast.error(err.message || "Failed to approve"),
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { data, error } = await supabase.rpc("reject_beta_referral", {
        p_referral_id: id,
        p_notes: notes || null,
      });
      if (error) throw error;
      const result = data as any;
      if (!result?.success) throw new Error(result?.error || "Rejection failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["beta-referrals"] });
      toast.success("Referral rejected");
      setRejectingId(null);
      setRejectNotes("");
    },
    onError: () => toast.error("Failed to reject referral"),
  });

  // Issue manual credit
  const issueManualCreditMutation = useMutation({
    mutationFn: async () => {
      // Look up user by email
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, name, email")
        .eq("email", creditEmail.trim())
        .single();
      if (profileError || !profile) throw new Error("User not found with that email");

      const fullName = [creditFirstName.trim(), creditLastName.trim()].filter(Boolean).join(" ") || profile.name || creditEmail;

      const { error } = await supabase.from("beta_credits").insert({
        user_id: profile.id,
        amount: Number(creditAmount),
        type: "issued",
        description: creditDescription || `Manual credit — $${creditAmount} — ${fullName}`,
      });
      if (error) throw error;

      // Fire beta_approved email to the tester
      try {
        await supabase.functions.invoke("ecommerce-email-orchestrator", {
          body: {
            eventType: "beta_approved",
            recipientEmail: creditEmail.trim(),
            data: {
              recipient_name: fullName,
              credit_amount: Number(creditAmount),
            },
          },
        });
      } catch (emailErr) {
        console.error("Failed to send beta_approved email:", emailErr);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["beta-credits-all"] });
      toast.success("Credit issued & welcome email sent");
      setIssueCreditOpen(false);
      setCreditEmail("");
      setCreditAmount("100");
      setCreditDescription("");
      setCreditFirstName("");
      setCreditLastName("");
    },
    onError: (err: any) => toast.error(err.message || "Failed to issue credit"),
  });

  // Fetch profiles for tester name resolution (fallback for manual credits)
  const creditUserIds = React.useMemo(() => {
    return [...new Set(allCredits.map(c => c.user_id))];
  }, [allCredits]);

  const { data: creditProfiles = [] } = useQuery({
    queryKey: ["beta-credit-profiles", creditUserIds],
    queryFn: async () => {
      if (creditUserIds.length === 0) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, email")
        .in("id", creditUserIds);
      if (error) throw error;
      return data || [];
    },
    enabled: creditUserIds.length > 0,
  });

  // Compute tester balances
  const testerBalances: TesterBalance[] = React.useMemo(() => {
    const balanceMap = new Map<string, TesterBalance>();
    
    for (const credit of allCredits) {
      if (!balanceMap.has(credit.user_id)) {
        // Try referral chain first, then profiles fallback
        const referral = referrals.find(r => r.referred_id === credit.user_id);
        const profile = creditProfiles.find(p => p.id === credit.user_id);
        balanceMap.set(credit.user_id, {
          userId: credit.user_id,
          name: referral?.referred_profile?.name || profile?.name || "Unknown",
          email: referral?.referred_profile?.email || referral?.referred_email || profile?.email || "Unknown",
          issued: 0,
          spent: 0,
          remaining: 0,
          orderCount: 0,
        });
      }

      const tester = balanceMap.get(credit.user_id)!;
      if (credit.type === "issued" || credit.type === "refunded") {
        tester.issued += credit.amount;
      } else if (credit.type === "spent") {
        tester.spent += Math.abs(credit.amount);
        if (credit.order_id) tester.orderCount++;
      }
      tester.remaining = tester.issued - tester.spent;
    }
    
    return Array.from(balanceMap.values());
  }, [allCredits, referrals, creditProfiles]);

  // Stats
  const pendingApproval = referrals.filter(r => r.status === "pending_approval" || r.status === "signed_up" || r.status === "pending").length;
  const totalApproved = referrals.filter(r => r.status === "credit_issued").length;
  const totalCreditsIssued = testerBalances.reduce((sum, t) => sum + t.issued, 0);
  const totalCreditsSpent = testerBalances.reduce((sum, t) => sum + t.spent, 0);
  const remainingLiability = totalCreditsIssued - totalCreditsSpent;

  const statusBadge = (status: string) => {
    switch (status) {
      case "pending_approval":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Pending Approval</Badge>;
      case "signed_up":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Signed Up</Badge>;
      case "credit_issued":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Credit Issued</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "reward_paid":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Paid</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Beta Program</h1>
          <p className="text-muted-foreground">Manage beta testers, approve referrals, and track $100 store credits.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setCheckinOpen(true)} variant="outline">
            <Mail className="h-4 w-4 mr-2" />
            Send Check-In
          </Button>
          <Button onClick={() => setIssueCreditOpen(true)} variant="outline">
            <CreditCard className="h-4 w-4 mr-2" />
            Issue Credit
          </Button>
        </div>
      </div>

      <Tabs defaultValue="analytics" className="w-full">
        <TabsList>
          <TabsTrigger value="analytics">Tester Analytics</TabsTrigger>
          <TabsTrigger value="approvals">Approvals & Credits</TabsTrigger>
          <TabsTrigger value="feedback" className="relative">
            Feedback
            {feedbackNewCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold h-5 min-w-5 px-1">
                {feedbackNewCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="approvals" className="space-y-6 mt-4">

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Clock className="h-8 w-8 text-amber-500" />
            <div>
              <p className="text-2xl font-bold">{pendingApproval}</p>
              <p className="text-xs text-muted-foreground">Pending Approval</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Users className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{totalApproved}</p>
              <p className="text-xs text-muted-foreground">Active Testers</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <DollarSign className="h-8 w-8 text-emerald-500" />
            <div>
              <p className="text-2xl font-bold">${totalCreditsIssued.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Issued</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Gift className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">${remainingLiability.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Remaining Liability</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section 1: Approval Queue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Referral Chain & Approval Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingReferrals ? (
            <p className="text-center text-muted-foreground py-8">Loading...</p>
          ) : referrals.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No referrals yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Referrer</TableHead>
                  <TableHead>Invitee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                    <TableCell className="text-right">
                      {(r.status === "pending_approval" || r.status === "signed_up" || r.status === "pending") && (
                        <div className="flex items-center gap-2 justify-end">
                          <Button
                            size="sm"
                            onClick={() => approveMutation.mutate(r.id)}
                            disabled={approveMutation.isPending}
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            <CheckCircle className="h-3.5 w-3.5 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => { setRejectingId(r.id); setRejectNotes(""); }}
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                      {r.status === "credit_issued" && (
                        <span className="text-xs text-emerald-600 font-medium">Approved</span>
                      )}
                      {r.status === "rejected" && (
                        <span className="text-xs text-muted-foreground">{r.reward_notes || "Rejected"}</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Section 2: Tester Balances */}
      {testerBalances.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Beta Tester Balances
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tester</TableHead>
                  <TableHead className="text-right">Issued</TableHead>
                  <TableHead className="text-right">Spent</TableHead>
                  <TableHead className="text-right">Remaining</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {testerBalances.map((tester) => (
                  <React.Fragment key={tester.userId}>
                      <TableRow>
                        <TableCell>
                          <div>
                            <p className="font-medium">{tester.name}</p>
                            <p className="text-xs text-muted-foreground">{tester.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">${tester.issued.toFixed(2)}</TableCell>
                        <TableCell className="text-right">${tester.spent.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-semibold">
                          <span className={tester.remaining > 0 ? "text-emerald-600" : "text-muted-foreground"}>
                            ${tester.remaining.toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">{tester.orderCount}</TableCell>
                        <TableCell className="flex items-center gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Send check-in email"
                            disabled={sendingCheckin}
                            onClick={async () => {
                              setSendingCheckin(true);
                              try {
                                const { data, error } = await supabase.functions.invoke('beta-checkin-emailer', {
                                  body: { target_email: tester.email },
                                });
                                if (error) throw error;
                                if (data?.success) {
                                  toast.success(`Check-in email sent to ${tester.email}`);
                                } else {
                                  throw new Error(data?.error || 'Failed to send');
                                }
                              } catch (err: any) {
                                toast.error(err.message || 'Failed to send check-in email');
                              } finally {
                                setSendingCheckin(false);
                              }
                            }}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setExpandedTester(expandedTester === tester.userId ? null : tester.userId)}>
                            {expandedTester === tester.userId ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                        </TableCell>
                      </TableRow>
                      {expandedTester === tester.userId && (
                        <tr>
                          <td colSpan={6} className="p-4 bg-muted/50">
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Transaction History</p>
                              {allCredits
                                .filter(c => c.user_id === tester.userId)
                                .map(c => (
                                  <div key={c.id} className="flex justify-between text-sm py-1 border-b border-border/50">
                                    <div>
                                      <span className={c.amount > 0 ? "text-emerald-600" : "text-destructive"}>
                                        {c.amount > 0 ? "+" : ""}{c.amount.toFixed(2)}
                                      </span>
                                      <span className="text-muted-foreground ml-2">{c.description || c.type}</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</span>
                                  </div>
                                ))}
                            </div>
                          </td>
                        </tr>
                      )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <BetaTesterAnalytics />
        </TabsContent>

        <TabsContent value="feedback" className="mt-4">
          <BetaFeedbackViewer onNewCount={setFeedbackNewCount} />
        </TabsContent>
      </Tabs>

      <Dialog open={!!rejectingId} onOpenChange={() => setRejectingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Referral</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Optional reason for rejection"
            value={rejectNotes}
            onChange={(e) => setRejectNotes(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectingId(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => rejectingId && rejectMutation.mutate({ id: rejectingId, notes: rejectNotes })}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? "Rejecting..." : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Issue Credit Dialog */}
      <Dialog open={issueCreditOpen} onOpenChange={setIssueCreditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Issue Manual Credit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">First Name</label>
                <Input
                  placeholder="Jane"
                  value={creditFirstName}
                  onChange={(e) => setCreditFirstName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Last Name</label>
                <Input
                  placeholder="Doe"
                  value={creditLastName}
                  onChange={(e) => setCreditLastName(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">User Email</label>
              <Input
                placeholder="user@example.com"
                value={creditEmail}
                onChange={(e) => setCreditEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Amount ($)</label>
              <Input
                type="number"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description (optional)</label>
              <Input
                placeholder="e.g., Top-up credit for extra testing"
                value={creditDescription}
                onChange={(e) => setCreditDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIssueCreditOpen(false)}>Cancel</Button>
            <Button
              onClick={() => issueManualCreditMutation.mutate()}
              disabled={issueManualCreditMutation.isPending || !creditEmail}
            >
              {issueManualCreditMutation.isPending ? "Issuing..." : `Issue $${creditAmount}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Check-In Dialog */}
      <Dialog open={checkinOpen} onOpenChange={setCheckinOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Check-In Email</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Send a personalized weekly check-in email with a working "Give Feedback" link to a specific beta tester.
          </p>
          <div>
            <label className="text-sm font-medium">Tester Email</label>
            <Input
              placeholder="justncmeeks@gmail.com"
              value={checkinEmail}
              onChange={(e) => setCheckinEmail(e.target.value)}
            />
          </div>
          {testerBalances.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {testerBalances.map((t) => (
                <Button
                  key={t.userId}
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => setCheckinEmail(t.email)}
                >
                  {t.name}
                </Button>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckinOpen(false)}>Cancel</Button>
            <Button
              disabled={sendingCheckin || !checkinEmail}
              onClick={async () => {
                setSendingCheckin(true);
                try {
                  const { data, error } = await supabase.functions.invoke('beta-checkin-emailer', {
                    body: { target_email: checkinEmail.trim() },
                  });
                  if (error) throw error;
                  if (data?.success) {
                    toast.success(`Check-in email sent to ${checkinEmail}`);
                    setCheckinOpen(false);
                    setCheckinEmail("");
                  } else {
                    throw new Error(data?.error || 'Failed to send');
                  }
                } catch (err: any) {
                  toast.error(err.message || 'Failed to send check-in email');
                } finally {
                  setSendingCheckin(false);
                }
              }}
            >
              {sendingCheckin ? "Sending..." : "Send Check-In"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrunklineReferralsTab;
