import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gift, Truck, Package, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";
import { format } from "date-fns";
import { computeOrderSteps } from "@/utils/orderTrackingUtils";

interface IncomingGift {
  id: string;
  status: string;
  created_at: string;
  shipping_address: any;
  gift_options: any;
  line_items: any;
  user_id: string;
  scheduled_delivery_date: string | null;
  fulfilled_at: string | null;
  zinc_timeline_events?: any[];
  merchant_tracking_data?: any;
}

const statusLabels: Record<string, string> = {
  payment_confirmed: "Being prepared",
  processing: "Processing",
  shipped: "On its way",
  delivered: "Delivered",
  scheduled: "Scheduled",
};

const IncomingGiftsWidget = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [gifts, setGifts] = useState<IncomingGift[]>([]);
  const [senderNames, setSenderNames] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchIncomingGifts = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .eq("recipient_id", user.id)
          .not("status", "in", '("cancelled","failed","split_parent")')
          .order("created_at", { ascending: false })
          .limit(5);

        if (error) {
          console.error("Error fetching incoming gifts:", error);
          return;
        }

        setGifts((data as any[]) || []);

        // Fetch sender names
        const senderIds = [...new Set((data || []).map((g: any) => g.user_id).filter(Boolean))];
        if (senderIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, name")
            .in("id", senderIds);

          const nameMap: Record<string, string> = {};
          (profiles || []).forEach((p: any) => {
            nameMap[p.id] = p.name?.split(" ")[0] || "Someone";
          });
          setSenderNames(nameMap);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchIncomingGifts();
  }, [user]);

  if (isLoading) return null;
  if (gifts.length === 0) return null;

  const getStatusIcon = (status: string) => {
    if (status === "shipped") return Truck;
    if (status === "delivered") return Package;
    return Gift;
  };

  const getStepProgress = (gift: IncomingGift) => {
    const steps = computeOrderSteps(
      gift.status,
      Array.isArray(gift.zinc_timeline_events) ? gift.zinc_timeline_events : [],
      gift.created_at,
      gift.fulfilled_at || undefined
    );
    const completedCount = steps.filter((s) => s.status === "completed").length;
    const activeCount = steps.filter((s) => s.status === "active").length;
    return ((completedCount + activeCount * 0.5) / steps.length) * 100;
  };

  return (
    <Card className="border border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Gift className="h-5 w-5 text-destructive" />
            Incoming Gifts
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {gifts.length} gift{gifts.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {gifts.map((gift) => {
          const StatusIcon = getStatusIcon(gift.status);
          const senderName = senderNames[gift.user_id] || "Someone special";
          const isSurprise = gift.gift_options?.isSurpriseGift || gift.gift_options?.keepSurprise;
          const giftMessage = gift.gift_options?.giftMessage;
          const progress = getStepProgress(gift);

          return (
            <div
              key={gift.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => navigate(`/orders/${gift.id}`)}
            >
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <StatusIcon className="h-5 w-5 text-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {isSurprise ? "A surprise gift" : "A gift"} from {senderName}
                </p>
                {giftMessage && !isSurprise && (
                  <p className="text-xs text-muted-foreground truncate italic">
                    "{giftMessage}"
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-foreground rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {statusLabels[gift.status] || gift.status}
                  </span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </div>
          );
        })}

        {gifts.length > 3 && (
          <Button
            variant="ghost"
            className="w-full text-sm"
            onClick={() => navigate("/orders?tab=incoming")}
          >
            View all incoming gifts
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default IncomingGiftsWidget;
