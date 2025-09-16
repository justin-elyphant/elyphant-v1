import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { triggerHapticFeedback } from "@/utils/haptics";

export const MobileConnectionsHeader: React.FC = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    triggerHapticFeedback('light');
    navigate(-1);
  };

  const handleSettings = () => {
    triggerHapticFeedback('light');
    navigate('/settings/privacy');
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border">
      <div className="flex items-center justify-between px-4 py-3 h-14">
        <Button
          variant="ghost"
          size="sm"
          className="h-10 w-10 p-0"
          onClick={handleBack}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">Connections</h1>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="h-10 w-10 p-0"
          onClick={handleSettings}
        >
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
};