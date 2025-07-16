import React, { useState } from "react";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GiftSetupWizard } from "@/components/gifting/GiftSetupWizard";

const QuickGiftCTA = () => {
  const [wizardOpen, setWizardOpen] = useState(false);

  return (
    <>
      {/* Quick Gift Setup CTA */}
      <div className="p-6 border rounded-lg bg-gradient-to-r from-emerald-100 via-teal-100 to-cyan-100 dark:from-emerald-900/30 dark:via-teal-900/30 dark:to-cyan-900/30 shadow-lg relative overflow-hidden">
        {/* Subtle animated background effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-cyan-500/5 animate-pulse"></div>
        
        <div className="flex items-center justify-between relative z-10">
          <div>
            <h4 className="font-semibold flex items-center">
              <Zap className="h-5 w-5 mr-2 text-emerald-600 dark:text-emerald-400" />
              <span className="bg-gradient-to-r from-emerald-700 to-cyan-700 bg-clip-text text-transparent">
                Quick Gift Setup
              </span>
            </h4>
            <p className="text-sm text-muted-foreground mt-1">Set up a personalized gift in minutes with our guided wizard</p>
          </div>
          <Button 
            onClick={() => setWizardOpen(true)}
            className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white border-0 shadow-md"
          >
            <Zap className="h-4 w-4 mr-2" />
            Get Started
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