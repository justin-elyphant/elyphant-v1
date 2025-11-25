import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Gift } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";

interface UpcomingGift {
  id: string;
  scheduled_date: string;
  recipient_name: string;
}

const UpcomingAutoGiftsWidget = () => {
  const { user } = useAuth();
  const [upcomingGifts, setUpcomingGifts] = useState<UpcomingGift[]>([]);

  useEffect(() => {
    const fetchUpcomingGifts = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("auto_gifting_rules")
        .select("id, scheduled_date, recipient_id, pending_recipient_email")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .gte("scheduled_date", new Date().toISOString())
        .order("scheduled_date", { ascending: true })
        .limit(1);

      if (error) {
        console.error("Error fetching upcoming gifts:", error);
        return;
      }

      if (!data || data.length === 0) {
        setUpcomingGifts([]);
        return;
      }

      const giftsWithNames = await Promise.all(
        data.map(async (gift) => {
          if (gift.recipient_id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("name")
              .eq("id", gift.recipient_id)
              .single();
            return {
              ...gift,
              recipient_name: profile?.name || "Unknown",
            };
          }
          return {
            ...gift,
            recipient_name: gift.pending_recipient_email || "Pending Invite",
          };
        })
      );

      setUpcomingGifts(giftsWithNames);
    };

    fetchUpcomingGifts();
  }, [user]);

  if (upcomingGifts.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3 mb-4">
            <Gift className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <h3 className="text-sm font-medium mb-1">Upcoming AI Gifts</h3>
              <p className="text-sm text-muted-foreground">No gifts scheduled</p>
            </div>
          </div>
          <div className="pt-3 border-t border-border">
            <Link 
              to="/dashboard?tab=auto-gifts" 
              className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
            >
              View all AI gifts
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const nextGift = upcomingGifts[0];

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-3">Upcoming AI Gifts</h3>
          <div className="space-y-1">
            <p className="text-sm font-medium">{nextGift.recipient_name}</p>
            <p className="text-sm text-muted-foreground">
              {new Date(nextGift.scheduled_date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          </div>
        </div>
        <div className="pt-3 border-t border-border">
          <Link 
            to="/dashboard?tab=auto-gifts" 
            className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
          >
            View all AI gifts
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default UpcomingAutoGiftsWidget;
