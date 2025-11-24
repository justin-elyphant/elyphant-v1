import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift, Calendar, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";
import { Link } from "react-router-dom";

interface UpcomingGift {
  id: string;
  scheduled_date: string;
  recipient_name: string;
}

const UpcomingAutoGiftsWidget = () => {
  const { user } = useAuth();
  const [upcomingGifts, setUpcomingGifts] = useState<UpcomingGift[]>([]);

  useEffect(() => {
    if (!user) return;
    
    const fetchUpcoming = async () => {
      const { data } = await supabase
        .from('auto_gifting_rules')
        .select('id, scheduled_date, profiles(name)')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .gte('scheduled_date', new Date().toISOString())
        .order('scheduled_date', { ascending: true })
        .limit(3);

      if (data) {
        setUpcomingGifts(
          data.map((gift: any) => ({
            id: gift.id,
            scheduled_date: gift.scheduled_date,
            recipient_name: gift.profiles?.name || "Unknown",
          }))
        );
      }
    };

    fetchUpcoming();
  }, [user]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          Upcoming Auto-Gifts
        </CardTitle>
      </CardHeader>
      <CardContent>
        {upcomingGifts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming auto-gifts scheduled</p>
        ) : (
          <div className="space-y-3">
            {upcomingGifts.map((gift) => (
              <div key={gift.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{gift.recipient_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(gift.scheduled_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link to="/dashboard?tab=auto-gifts">
                View All
                <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingAutoGiftsWidget;
