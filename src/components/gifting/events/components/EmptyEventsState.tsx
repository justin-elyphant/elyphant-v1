
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Plus } from "lucide-react";

interface EmptyEventsStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  onAddEvent?: () => void; // Legacy prop for backward compatibility
}

const EmptyEventsState = ({ 
  title, 
  description, 
  actionLabel, 
  onAction, 
  onAddEvent,
  icon 
}: EmptyEventsStateProps) => {
  const handleAction = onAction || onAddEvent;
  
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="mb-4">
          {icon || <Calendar className="h-12 w-12 text-muted-foreground" />}
        </div>
        <h3 className="text-lg font-medium mb-2">{title}</h3>
        <p className="text-muted-foreground text-center max-w-md mb-6">
          {description}
        </p>
        {(actionLabel || handleAction) && (
          <Button onClick={handleAction}>
            <Plus className="h-4 w-4 mr-2" />
            {actionLabel || "Add Event"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default EmptyEventsState;
