import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Zap, Users, Star, ArrowRight, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";
import UnifiedQuickSetup from "./UnifiedQuickSetup";

interface UnifiedAutoGiftEntryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UnifiedAutoGiftEntry = ({ open, onOpenChange }: UnifiedAutoGiftEntryProps) => {
  const { user } = useAuth();
  const [selectedPath, setSelectedPath] = useState<"nicole" | "manual" | null>(null);
  

  const handleNicolePath = () => {
    setSelectedPath("nicole");
    onOpenChange(false);
    
    // Trigger the unified header Nicole system with auto-gifting context
    const triggerEvent = new CustomEvent('triggerNicole', {
      detail: {
        mode: 'auto-gifting',
        capability: 'auto_gifting',
        selectedIntent: 'auto-gift',
        contextData: {
          capability: 'auto_gifting',
          selectedIntent: 'auto-gift',
          mode: 'auto-gifting',
          conversationPhase: 'auto_gift_choice'
        }
      }
    });
    window.dispatchEvent(triggerEvent);
    
    toast.success("Nicole is ready to help you set up auto-gifting!");
  };

  const handleManualPath = () => {
    setSelectedPath("manual");
  };

  const handleBack = () => {
    setSelectedPath(null);
  };

  const handleClose = () => {
    setSelectedPath(null);
    onOpenChange(false);
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              {selectedPath === "manual" ? "Quick Auto-Gift Setup" : "Set Up Auto-Gifting"}
            </DialogTitle>
          </DialogHeader>
          
          {selectedPath === "manual" ? (
            <div className="space-y-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="mb-4"
              >
                ← Back to options
              </Button>
              <UnifiedQuickSetup onComplete={handleClose} />
            </div>
          ) : (
            <div className="space-y-6 py-4">
              <div className="text-center space-y-2">
                <p className="text-muted-foreground">
                  Choose how you'd like to set up automatic gift-giving
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="h-4 w-4" />
                  <span>Smart. Simple. Thoughtful.</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nicole AI Path */}
                <Card 
                  className="cursor-pointer border-2 hover:border-primary/50 transition-all duration-200 hover:shadow-lg group"
                  onClick={handleNicolePath}
                >
                  <CardContent className="p-6 text-center space-y-4">
                    <div className="relative">
                      <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                        <Bot className="h-8 w-8 text-white" />
                      </div>
                      <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0">
                        Recommended
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
                        Nicole, Set This Up
                        <Sparkles className="h-4 w-4 text-yellow-500" />
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Let our AI guide you through a personalized conversation to set up auto-gifting
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-2 text-xs text-emerald-600">
                        <Star className="h-3 w-3" />
                        <span>Smart recommendations</span>
                      </div>
                      <div className="flex items-center justify-center gap-2 text-xs text-emerald-600">
                        <Users className="h-3 w-3" />
                        <span>Connection analysis</span>
                      </div>
                      <div className="flex items-center justify-center gap-2 text-xs text-emerald-600">
                        <Zap className="h-3 w-3" />
                        <span>Complete automation</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <Button className="w-full group-hover:bg-primary/90">
                        Start with Nicole
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Manual Quick Setup Path */}
                <Card 
                  className="cursor-pointer border-2 hover:border-primary/50 transition-all duration-200 hover:shadow-lg group"
                  onClick={handleManualPath}
                >
                  <CardContent className="p-6 text-center space-y-4">
                    <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <Zap className="h-8 w-8 text-white" />
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">
                        Quick Setup (1-2-3)
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Simple 3-step process to set up auto-gifting yourself
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-2 text-xs text-blue-600">
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">1</span>
                        <span>Who to gift</span>
                      </div>
                      <div className="flex items-center justify-center gap-2 text-xs text-blue-600">
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">2</span>
                        <span>When & budget</span>
                      </div>
                      <div className="flex items-center justify-center gap-2 text-xs text-blue-600">
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">3</span>
                        <span>Confirm & activate</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <Button variant="outline" className="w-full group-hover:bg-muted">
                        Manual Setup
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  Both paths create the same powerful auto-gifting experience
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </>
  );
};

export default UnifiedAutoGiftEntry;