import React from "react";
import { Button } from "@/components/ui/button";
import { Gift, Calendar } from "lucide-react";

interface SmartAutoGiftCTAProps {
  recipientName: string;
  occasion: string;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
}

const SmartAutoGiftCTA: React.FC<SmartAutoGiftCTAProps> = ({
  recipientName,
  occasion,
  loading = false,
  onConfirm,
}) => {
  return (
    <div className="w-full rounded-lg border p-3 flex items-center justify-between gap-3 bg-background">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-md flex items-center justify-center border">
          <Gift className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-medium">
            Set up auto-gifting for {recipientName}'s {occasion}
          </p>
          <p className="text-xs text-muted-foreground">
            Never miss it again — Nicole will handle reminders and picks
          </p>
        </div>
      </div>
      <Button onClick={onConfirm} disabled={loading}>
        <Calendar className="h-4 w-4 mr-2" />
        {loading ? 'Setting up...' : 'Set up'}
      </Button>
    </div>
  );
};

export default SmartAutoGiftCTA;
