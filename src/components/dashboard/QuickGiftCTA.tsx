import React, { useState } from "react";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GiftSetupWizard } from "@/components/gifting/GiftSetupWizard";

const QuickGiftCTA = () => {
  const [wizardOpen, setWizardOpen] = useState(false);

  return (
    <>
      {/* Quick Gift Setup CTA */}
      <div className="p-6 border rounded-lg bg-gradient-to-r from-cyan-100 via-blue-100 to-amber-100 dark:from-cyan-900/30 dark:via-blue-900/30 dark:to-amber-900/30 shadow-lg relative overflow-hidden">
        {/* Subtle animated background effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-blue-500/5 to-amber-500/5 animate-pulse"></div>
        
        <div className="flex items-center justify-between relative z-10">
          <div>
            <h4 className="font-semibold flex items-center">
              <Zap className="h-5 w-5 mr-2 text-cyan-600 dark:text-cyan-400" />
              <span className="bg-gradient-to-r from-cyan-700 to-amber-700 bg-clip-text text-transparent">
                AI Gift Autopilot
              </span>
            </h4>
            <p className="text-sm text-muted-foreground mt-1">Don't know what to get? Our AI will pick, purchase, and deliver the perfect gift automatically</p>
          </div>
          <Button 
            onClick={() => setWizardOpen(true)}
            className="bg-gradient-to-r from-cyan-600 to-amber-600 hover:from-cyan-700 hover:to-amber-700 text-white border-0 shadow-md"
          >
            <Zap className="h-4 w-4 mr-2" />
            Pick A Gift For Me
          </Button>
        </div>
      </div>

      {/* Gift Setup Wizard */}
      <GiftSetupWizard 
        open={wizardOpen}
        onOpenChange={setWizardOpen}
      />
    </>
  );
};

export default QuickGiftCTA;