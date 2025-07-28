
import React from 'react';
import { format } from 'date-fns';
import { User, CalendarIcon, Brain, Star } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScheduledGift } from "@/types/gift-scheduling";

interface ScheduledGiftCardProps {
  gift: ScheduledGift;
  showActions?: boolean;
  nicoleAttribution?: {
    agent: string;
    discovery_method?: string;
    confidence_score: number;
    data_sources: string[];
  };
}

const ScheduledGiftCard: React.FC<ScheduledGiftCardProps> = ({ 
  gift, 
  showActions = true, 
  nicoleAttribution 
}) => {
  return (
    <Card key={gift.id}>
      <CardContent className="p-4 flex flex-col sm:flex-row items-center sm:items-start gap-4">
        <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
          <img 
            src={gift.productImage} 
            alt={gift.productName}
            className="w-full h-full object-cover" 
          />
        </div>
        
        <div className="flex-grow text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
            <h4 className="font-medium">{gift.productName}</h4>
            {nicoleAttribution && (
              <Badge variant="outline" className="text-xs flex items-center gap-1">
                <Brain className="h-3 w-3" />
                Nicole-discovered
              </Badge>
            )}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-muted-foreground">
            <div className="flex items-center justify-center sm:justify-start">
              <User className="h-3 w-3 mr-1" /> 
              <span>To: {gift.recipientName}</span>
            </div>
            <div className="flex items-center justify-center sm:justify-start">
              <CalendarIcon className="h-3 w-3 mr-1" />
              <span>{format(gift.scheduledDate, 'PPP')}</span>
            </div>
          </div>
          {nicoleAttribution && nicoleAttribution.confidence_score > 0 && (
            <div className="flex items-center justify-center sm:justify-start gap-1 mt-1">
              <Star className="h-3 w-3 text-amber-500" />
              <span className="text-xs text-muted-foreground">
                {Math.round(nicoleAttribution.confidence_score * 100)}% confidence
              </span>
            </div>
          )}
        </div>
        
        {showActions ? (
          <div className="flex gap-2">
            <Button size="sm" variant="outline">Edit</Button>
            <Button size="sm" variant="destructive">Cancel</Button>
          </div>
        ) : (
          <div>
            <span className={`px-2 py-1 text-xs rounded-full ${
              gift.status === 'sent' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {gift.status === 'sent' ? 'Sent' : 'Failed'}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ScheduledGiftCard;
