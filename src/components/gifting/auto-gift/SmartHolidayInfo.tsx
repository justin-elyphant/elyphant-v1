import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Calendar, Users } from "lucide-react";

interface SmartHolidayInfoProps {
  holidayType: string;
  recipientName?: string;
}

const SmartHolidayInfo: React.FC<SmartHolidayInfoProps> = ({ 
  holidayType, 
  recipientName 
}) => {
  const holidayNames: { [key: string]: string } = {
    christmas: "Christmas",
    valentine: "Valentine's Day", 
    mothers_day: "Mother's Day",
    fathers_day: "Father's Day"
  };

  const holidayName = holidayNames[holidayType] || holidayType;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                Smart Holiday Detection
              </Badge>
            </div>
            <p className="text-sm font-medium">
              {holidayName} will be added to your events calendar
            </p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                <span>The holiday date will appear in your "My Events" tab</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-3 w-3" />
                <span>Your connections will see it in their "Recipient Events" view</span>
              </div>
              {recipientName && (
                <p className="text-xs mt-2 p-2 bg-muted/50 rounded">
                  <strong>{recipientName}</strong> will see "{holidayName}" in their gifting dashboard 
                  and can set up auto-gifting for you too!
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SmartHolidayInfo;