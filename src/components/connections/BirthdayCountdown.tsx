import React, { useState, useEffect } from "react";
import { Calendar, Gift } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { formatBirthdayForDisplay, shouldDisplayBirthday } from "@/utils/birthdayUtils";

interface BirthdayCountdownProps {
  userId: string;
  connectionName: string;
}

export const BirthdayCountdown = ({ userId, connectionName }: BirthdayCountdownProps) => {
  const [birthdayInfo, setBirthdayInfo] = useState<{
    dob: string | null;
    dataSharingSettings: any;
    daysUntil: number | null;
    formattedBirthday: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBirthdayInfo = async () => {
      try {
        setLoading(true);

        // Fetch user's profile and birthday info
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('dob, birth_year, data_sharing_settings')
          .eq('id', userId)
          .single();

        if (error || !profile?.dob) {
          setBirthdayInfo(null);
          setLoading(false);
          return;
        }

        // Check if birthday should be displayed (assuming friend relationship for connections)
        const canShowBirthday = shouldDisplayBirthday(profile.data_sharing_settings, 'friend');
        
        if (!canShowBirthday) {
          setBirthdayInfo(null);
          setLoading(false);
          return;
        }

        // Calculate days until birthday
        const now = new Date();
        const currentYear = now.getFullYear();
        
        // Parse the birthday (assuming MM-DD format)
        const [month, day] = profile.dob.split('-').map(Number);
        if (!month || !day) {
          setBirthdayInfo(null);
          setLoading(false);
          return;
        }

        // Create birthday date for this year and next year
        const thisYearBirthday = new Date(currentYear, month - 1, day);
        const nextYearBirthday = new Date(currentYear + 1, month - 1, day);

        // Determine which birthday to use (this year if it hasn't passed, otherwise next year)
        const birthdayToUse = thisYearBirthday >= now ? thisYearBirthday : nextYearBirthday;
        
        // Calculate days until birthday
        const timeDiff = birthdayToUse.getTime() - now.getTime();
        const daysUntil = Math.ceil(timeDiff / (1000 * 3600 * 24));

        // Format birthday for display
        const formattedBirthday = formatBirthdayForDisplay(profile.dob, profile.birth_year);

        setBirthdayInfo({
          dob: profile.dob,
          dataSharingSettings: profile.data_sharing_settings,
          daysUntil,
          formattedBirthday
        });
      } catch (err) {
        console.error('Error fetching birthday info:', err);
        setBirthdayInfo(null);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchBirthdayInfo();
    }
  }, [userId]);

  if (loading || !birthdayInfo || !birthdayInfo.formattedBirthday) {
    return null;
  }

  const { daysUntil, formattedBirthday } = birthdayInfo;

  // Only show if birthday is within 30 days
  if (!daysUntil || daysUntil > 30) {
    return null;
  }

  const isToday = daysUntil === 0;
  const isSoon = daysUntil <= 7;

  return (
    <Alert className={`${isToday ? 'border-primary bg-primary/5' : isSoon ? 'border-orange-500 bg-orange-50' : 'border-blue-500 bg-blue-50'}`}>
      <Calendar className={`h-4 w-4 ${isToday ? 'text-primary' : isSoon ? 'text-orange-500' : 'text-blue-500'}`} />
      <AlertDescription className="flex items-center justify-between">
        <div>
          <p className="font-medium">
            {isToday 
              ? `🎉 It's ${connectionName}'s birthday today!` 
              : `${connectionName}'s birthday is ${daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`}`
            }
          </p>
          <p className="text-sm text-muted-foreground">
            {formattedBirthday}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isToday ? "default" : isSoon ? "destructive" : "secondary"} className="text-xs">
            {isToday ? "Today!" : `${daysUntil} days`}
          </Badge>
          <Button size="sm" variant={isToday ? "default" : "outline"}>
            <Gift className="w-3 h-3 mr-1" />
            {isToday ? "Send Gift" : "Plan Gift"}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};