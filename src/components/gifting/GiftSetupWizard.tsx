import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Gift, Calendar, Heart, CreditCard } from "lucide-react";
import { WizardStepOne } from "./wizard/WizardStepOne";
import { WizardStepTwo } from "./wizard/WizardStepTwo";
import { WizardStepThree } from "./wizard/WizardStepThree";
import { WizardStepFour } from "./wizard/WizardStepFour";
import { WizardConfirmation } from "./wizard/WizardConfirmation";
import { pendingGiftsService } from "@/services/pendingGiftsService";
import { toast } from "sonner";

export interface GiftSetupData {
  // Step 1: Who
  recipientName: string;
  recipientEmail: string;
  relationshipType: string;
  shippingAddress?: any;
  recipientBirthDate?: string; // ISO date string for full birthday
  
  // Step 2: When
  giftingEvents: Array<{
    dateType: string;
    date: string;
    isRecurring: boolean;
    customName?: string;
  }>;
  
  // Step 3: Preferences
  autoGiftingEnabled: boolean;
  scheduledGiftingEnabled: boolean;
  budgetLimit?: number;
  giftCategories: string[];
  giftMessage?: string;
  notificationDays: number[];
  
  // Step 4: Payment (conditional)
  hasPaymentMethod?: boolean;
  skipPaymentSetup?: boolean;
  autoApproveEnabled?: boolean;
}

interface GiftSetupWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Partial<GiftSetupData>;
}

const getSteps = (showPaymentStep: boolean) => {
  const baseSteps = [
    { number: 1, title: "Who", icon: Heart, description: "Tell us about the gift recipient" },
    { number: 2, title: "When", icon: Calendar, description: "Set up important dates and occasions" },
    { number: 3, title: "Preferences", icon: Gift, description: "Configure your gifting preferences" }
  ];
  
  if (showPaymentStep) {
    baseSteps.push({ number: 4, title: "Payment", icon: CreditCard, description: "Set up payment for auto-gifting" });
  }
  
  return baseSteps;
};

export const GiftSetupWizard: React.FC<GiftSetupWizardProps> = ({
  open,
  onOpenChange,
  initialData = {}
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [giftSetupData, setGiftSetupData] = useState<GiftSetupData>({
    recipientName: "",
    recipientEmail: "",
    relationshipType: "friend",
    recipientBirthDate: undefined, // Will be set by date picker
    giftingEvents: [],
    autoGiftingEnabled: true,
    scheduledGiftingEnabled: false,
    giftCategories: [],
    notificationDays: [7, 3, 1],
    ...initialData
  });

  const handleStepComplete = (stepData: Partial<GiftSetupData>) => {
    const updatedData = { ...giftSetupData, ...stepData };
    setGiftSetupData(updatedData);
    
    // Determine if we need to show payment step
    const needsPaymentStep = updatedData.autoGiftingEnabled && currentStep === 3;
    const maxSteps = needsPaymentStep ? 4 : 3;
    
    if (currentStep < maxSteps) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleFinalSubmit(updatedData);
    }
  };

  const handleFinalSubmit = async (finalData: GiftSetupData) => {
    setIsLoading(true);
    try {
      // Create pending connection
      const connection = await pendingGiftsService.createPendingConnection(
        finalData.recipientEmail,
        finalData.recipientName,
        finalData.relationshipType,
        finalData.shippingAddress
      );

      // Create events
      for (const event of finalData.giftingEvents) {
        await pendingGiftsService.createEventForPending(
          connection.id,
          finalData.recipientEmail,
          event.dateType,
          event.date,
          event.isRecurring
        );

        // Create auto-gift rule if enabled
        if (finalData.autoGiftingEnabled) {
          await pendingGiftsService.createAutoGiftRuleForPending(
            connection.id,
            finalData.recipientEmail,
            event.dateType,
            finalData.budgetLimit,
            {
              source: "ai",
              categories: finalData.giftCategories,
              exclude_items: []
            },
            {
              enabled: true,
              days_before: finalData.notificationDays,
              email: true,
              push: false
            }
          );
        }
      }

      // Send invitation email (we'll implement this next)
      // await sendGiftInvitation(finalData.recipientEmail, finalData.recipientName, connection.invitation_token);

      setIsComplete(true);
      toast.success("Gift setup completed! Invitation will be sent to " + finalData.recipientName);
      
    } catch (error) {
      console.error("Error setting up gifts:", error);
      toast.error("Failed to set up gifts. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setIsComplete(false);
    setGiftSetupData({
      recipientName: "",
      recipientEmail: "",
      relationshipType: "friend",
      recipientBirthDate: undefined,
      giftingEvents: [],
      autoGiftingEnabled: true,
      scheduledGiftingEnabled: false,
      giftCategories: [],
      notificationDays: [7, 3, 1]
    });
    onOpenChange(false);
  };

  const renderCurrentStep = () => {
    if (isComplete) {
      return (
        <WizardConfirmation 
          data={giftSetupData}
          onClose={handleClose}
        />
      );
    }

    switch (currentStep) {
      case 1:
        return (
          <WizardStepOne
            data={giftSetupData}
            onNext={handleStepComplete}
          />
        );
      case 2:
        return (
          <WizardStepTwo
            data={giftSetupData}
            onNext={handleStepComplete}
          />
        );
      case 3:
        return (
          <WizardStepThree
            data={giftSetupData}
            onNext={handleStepComplete}
            isLoading={isLoading}
          />
        );
      case 4:
        return (
          <WizardStepFour
            data={giftSetupData}
            onNext={handleStepComplete}
            isLoading={isLoading}
          />
        );
      default:
        return null;
    }
  };

  // Determine if we need to show payment step based on current data
  const showPaymentStep = giftSetupData.autoGiftingEnabled;
  const steps = getSteps(showPaymentStep);
  const maxSteps = steps.length;
  const currentStepInfo = steps.find(step => step.number === currentStep);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <Gift className="h-6 w-6 text-primary" />
            {isComplete ? "Gift Setup Complete!" : "Quick Gift Setup"}
          </DialogTitle>
        </DialogHeader>

        {!isComplete && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              {steps.map((step) => {
                const Icon = step.icon;
                const isActive = step.number === currentStep;
                const isCompleted = step.number < currentStep;
                
                return (
                  <div
                    key={step.number}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : isCompleted
                        ? "bg-green-100 text-green-700"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="font-medium">{step.title}</span>
                  </div>
                );
              })}
            </div>
            
            <Progress value={(currentStep / maxSteps) * 100} className="h-2" />
            
            {currentStepInfo && (
              <p className="text-sm text-muted-foreground mt-2">
                Step {currentStep} of {maxSteps}: {currentStepInfo.description}
              </p>
            )}
          </div>
        )}

        <div className="min-h-[400px]">
          {renderCurrentStep()}
        </div>

        {!isComplete && (
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1 || isLoading}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            <div className="text-sm text-muted-foreground">
              {currentStep === maxSteps 
                ? "Click 'Complete Setup' to finish" 
                : "Complete this step to continue"
              }
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};