
import React from "react";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const QuickGiftCTA = () => {
  const navigate = useNavigate();
  
  const handleOpenGifting = () => {
    // Navigate to auto-gifts tab on dashboard
    navigate('/dashboard?tab=auto-gifts');
  };

  return (
    <>
      {/* Quick Gift Setup CTA */}
      <div className="p-4 sm:p-6 border rounded-lg bg-muted shadow-lg relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div className="flex-1">
            <h4 className="font-semibold flex items-center text-foreground">
              <Zap className="h-5 w-5 mr-2 text-muted-foreground" />
              AI Gift Autopilot
            </h4>
            <p className="text-sm text-muted-foreground mt-1">Don't know what to get? Our AI will pick, purchase, and deliver the perfect gift automatically</p>
          </div>
          <Button 
            onClick={handleOpenGifting}
            className="bg-elyphant-gradient text-white border-0 shadow-md hover:opacity-90 h-10 sm:h-9 w-full sm:w-auto"
            size="sm"
          >
            <Zap className="h-4 w-4 mr-2" />
            Enable AI Gifting
          </Button>
        </div>
      </div>
    </>
  );
};

export default QuickGiftCTA;
