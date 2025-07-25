
import React, { useState } from "react";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GiftSetupWizard } from "@/components/gifting/GiftSetupWizard";

const QuickGiftCTA = () => {
  const [wizardOpen, setWizardOpen] = useState(false);

  const handleOpenWizard = () => {
    console.log("Opening GiftSetupWizard from QuickGiftCTA");
    setWizardOpen(true);
  };

  const handleCloseWizard = (open: boolean) => {
    console.log("Closing GiftSetupWizard, open:", open);
    setWizardOpen(open);
  };

  return (
    <>
      {/* Quick Gift Setup CTA */}
      <div className="p-4 sm:p-6 border rounded-lg bg-gradient-to-r from-cyan-100 via-blue-100 to-amber-100 dark:from-cyan-900/30 dark:via-blue-900/30 dark:to-amber-900/30 shadow-lg relative overflow-hidden">
        {/* Subtle animated background effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-blue-500/5 to-amber-500/5 animate-pulse"></div>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div className="flex-1">
            <h4 className="font-semibold flex items-center">
              <Zap className="h-5 w-5 mr-2 text-cyan-600 dark:text-cyan-400" />
              <span className="bg-gradient-to-r from-cyan-700 to-amber-700 bg-clip-text text-transparent">
                AI Gift Autopilot
              </span>
            </h4>
            <p className="text-sm text-muted-foreground mt-1">Don't know what to get? Our AI will pick, purchase, and deliver the perfect gift automatically</p>
          </div>
          <Button 
            onClick={handleOpenWizard}
            className="bg-gradient-to-r from-cyan-600 to-amber-600 hover:from-cyan-700 hover:to-amber-700 text-white border-0 shadow-md h-10 sm:h-9 w-full sm:w-auto"
            size="sm"
          >
            <Zap className="h-4 w-4 mr-2" />
            Enable Auto-Gifting
          </Button>
        </div>
      </div>

      {/* Gift Setup Wizard */}
      <GiftSetupWizard 
        open={wizardOpen}
        onOpenChange={handleCloseWizard}
        initialData={null}
      />
    </>
  );
};

export default QuickGiftCTA;
