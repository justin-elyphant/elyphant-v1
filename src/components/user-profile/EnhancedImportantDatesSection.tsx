import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift, Calendar, Bot } from "lucide-react";
import { format, isValid, differenceInDays, isBefore } from "date-fns";

interface ImportantDate {
  date: string;
  description?: string;
  title?: string;
}

interface EnhancedImportantDatesSectionProps {
  importantDates: ImportantDate[];
  isOwnProfile: boolean;
}

const EnhancedImportantDatesSection = ({ importantDates, isOwnProfile }: EnhancedImportantDatesSectionProps) => {
  if (!importantDates || importantDates.length === 0) return null;
  
  // Filter and format valid dates
  const validDates = importantDates.filter(date => {
    try {
      const dateObj = new Date(date.date);
      return isValid(dateObj);
    } catch {
      return false;
    }
  });
  
  if (validDates.length === 0) return null;

  const getNextOccurrence = (dateString: string) => {
    const inputDate = new Date(dateString);
    const today = new Date();
    
    // Create this year's version of the date
    const thisYear = new Date(today.getFullYear(), inputDate.getMonth(), inputDate.getDate());
    
    // If this year's date has passed, use next year
    if (isBefore(thisYear, today)) {
      return new Date(today.getFullYear() + 1, inputDate.getMonth(), inputDate.getDate());
    }
    
    return thisYear;
  };

  const getDaysUntil = (dateString: string) => {
    const nextOccurrence = getNextOccurrence(dateString);
    return differenceInDays(nextOccurrence, new Date());
  };

  const handlePlanGift = (date: ImportantDate) => {
    const eventName = date.description || date.title || 'Special Date';
    const daysUntil = getDaysUntil(date.date);
    
    console.log(`Planning gift for ${eventName} in ${daysUntil} days`);
    // Dispatch Nicole event with gift planning context
    window.dispatchEvent(new CustomEvent('triggerNicole', {
      detail: {
        capability: 'gift-planning',
        source: 'event-planning',
        autoGreeting: true,
        greetingContext: {
          greeting: 'event-gift-planning',
          event: eventName,
          daysUntil: daysUntil,
          activeMode: 'gift-advisor'
        }
      }
    }));
  };
  
  return (
    <div className="mb-8">
      <h3 className="text-lg font-medium mb-2">Important Dates</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {validDates.map((date, index) => {
          const dateObj = new Date(date.date);
          const nextOccurrence = getNextOccurrence(date.date);
          const daysUntil = getDaysUntil(date.date);
          const description = date.description || date.title || 'Special Date';
          
          return (
            <Card key={index} className="relative">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Gift className="h-5 w-5 text-muted-foreground mt-1" />
                  <div className="flex-1">
                    <div className="font-medium">
                      {format(dateObj, "MMMM d")}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {description}
                    </div>
                    
                    {daysUntil > 0 && (
                      <div className="mt-2">
                        <div className="flex items-center gap-1 text-xs text-primary">
                          <Calendar className="h-3 w-3" />
                          {daysUntil === 1 ? 'Tomorrow!' : `${daysUntil} days away`}
                        </div>
                      </div>
                    )}
                    
                    {!isOwnProfile && daysUntil <= 60 && daysUntil > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePlanGift(date)}
                        className="mt-3 text-xs flex items-center gap-1"
                      >
                        <Bot className="h-3 w-3" />
                        Plan Gift
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default EnhancedImportantDatesSection;