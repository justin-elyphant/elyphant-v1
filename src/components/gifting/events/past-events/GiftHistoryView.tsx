
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Gift, Calendar, DollarSign } from "lucide-react";
import { ExtendedEventData } from "../types";

interface GiftHistoryViewProps {
  events: ExtendedEventData[];
}

interface GiftHistoryItem {
  id: string;
  event: ExtendedEventData;
  amount: number;
  date: string;
  method: "auto" | "manual";
  status: "sent" | "delivered" | "pending";
}

const GiftHistoryView = ({ events }: GiftHistoryViewProps) => {
  // Mock gift history data
  const giftHistory: GiftHistoryItem[] = events
    .filter(() => Math.random() > 0.4) // Simulate some events having gifts
    .map(event => ({
      id: `gift-${event.id}`,
      event,
      amount: Math.floor(Math.random() * 100) + 25,
      date: event.date,
      method: Math.random() > 0.6 ? "auto" : "manual",
      status: Math.random() > 0.2 ? "delivered" : "sent" as "sent" | "delivered",
    }));

  const totalSpent = giftHistory.reduce((sum, gift) => sum + gift.amount, 0);
  const autoGiftCount = giftHistory.filter(gift => gift.method === "auto").length;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <DollarSign className="h-8 w-8 text-green-600 mr-4" />
            <div>
              <div className="text-2xl font-bold">${totalSpent}</div>
              <p className="text-sm text-muted-foreground">Total Spent</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <Gift className="h-8 w-8 text-blue-600 mr-4" />
            <div>
              <div className="text-2xl font-bold">{giftHistory.length}</div>
              <p className="text-sm text-muted-foreground">Gifts Sent</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <Calendar className="h-8 w-8 text-purple-600 mr-4" />
            <div>
              <div className="text-2xl font-bold">{autoGiftCount}</div>
              <p className="text-sm text-muted-foreground">Auto Gifts</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gift History List */}
      <Card>
        <CardHeader>
          <CardTitle>Gift History</CardTitle>
        </CardHeader>
        <CardContent>
          {giftHistory.length === 0 ? (
            <div className="text-center py-8">
              <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No gifts sent yet</h3>
              <p className="text-muted-foreground">
                Your gift history will appear here once you start sending gifts
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {giftHistory.map((gift) => (
                <div key={gift.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={gift.event.avatarUrl} alt={gift.event.person} />
                      <AvatarFallback>{gift.event.person[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{gift.event.person}</div>
                      <div className="text-sm text-muted-foreground">
                        {gift.event.type} • {gift.date}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="font-medium">${gift.amount}</div>
                      <div className="text-sm text-muted-foreground">
                        {gift.method === "auto" ? "Auto-gifted" : "Manual"}
                      </div>
                    </div>
                    <Badge variant={gift.status === "delivered" ? "default" : "secondary"}>
                      {gift.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GiftHistoryView;
