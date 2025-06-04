
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Gift } from "lucide-react";
import { format, isValid } from "date-fns";

interface ImportantDate {
  date: string;
  description?: string;
  title?: string;
}

interface ImportantDatesSectionProps {
  importantDates: ImportantDate[];
}

const ImportantDatesSection = ({ importantDates }: ImportantDatesSectionProps) => {
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
  
  return (
    <div className="mb-8">
      <h3 className="text-lg font-medium mb-2">Important Dates</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {validDates.map((date, index) => {
          const dateObj = new Date(date.date);
          const description = date.description || date.title || 'Special Date';
          
          return (
            <Card key={index}>
              <CardContent className="p-4 flex items-start gap-3">
                <Gift className="h-5 w-5 text-muted-foreground mt-1" />
                <div>
                  <div className="font-medium">
                    {format(dateObj, "MMMM d")}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {description}
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

export default ImportantDatesSection;
