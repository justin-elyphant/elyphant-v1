import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, ArrowLeft, DollarSign, Calendar, Gift, CheckCircle, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { unifiedGiftManagementService } from "@/services/UnifiedGiftManagementService";
import { toast } from "sonner";
import UnifiedRecipientSelector from "./UnifiedRecipientSelector";

interface UnifiedQuickSetupProps {
  onComplete: () => void;
}

interface SetupData {
  recipient: {
    connectionId?: string;
    recipientId?: string;
    recipientEmail?: string;
    recipientName?: string;
    relationshipType?: string;
    connectionStatus?: string;
    isExistingConnection?: boolean;
    pendingInvitation?: boolean;
  };
  timing: {
    dateType: string;
    customDate?: string;
  };
  budget: {
    amount: number;
    giftSource: string;
  };
}

const UnifiedQuickSetup = ({ onComplete }: UnifiedQuickSetupProps) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [setupData, setSetupData] = useState<SetupData>({
    recipient: {},
    timing: {
      dateType: "birthday"
    },
    budget: {
      amount: 50,
      giftSource: "wishlist"
    }
  });

  const handleRecipientChange = (connectionId: string, data?: any) => {
    setSetupData(prev => ({
      ...prev,
      recipient: {
        connectionId,
        ...data
      }
    }));
  };

  const handleTimingChange = (field: string, value: string) => {
    setSetupData(prev => ({
      ...prev,
      timing: {
        ...prev.timing,
        [field]: value
      }
    }));
  };

  const handleBudgetChange = (field: string, value: string | number) => {
    setSetupData(prev => ({
      ...prev,
      budget: {
        ...prev.budget,
        [field]: value
      }
    }));
  };

  const canProceedToStep2 = setupData.recipient.connectionId;
  const canProceedToStep3 = canProceedToStep2 && setupData.timing.dateType;
  const canComplete = canProceedToStep3 && setupData.budget.amount > 0;

  const handleComplete = async () => {
    if (!user || !canComplete) return;

    setIsSubmitting(true);
    try {
      // Create the auto-gift rule using the unified service
      const ruleData = {
        user_id: user.id,
        recipient_id: setupData.recipient.recipientId || null,
        pending_recipient_email: setupData.recipient.recipientEmail || null,
        date_type: setupData.timing.dateType,
        budget_limit: setupData.budget.amount,
        is_active: true,
        notification_preferences: {
          enabled: true,
          days_before: [7, 3, 1],
          email: true,
          push: false
        },
        gift_selection_criteria: {
          source: setupData.budget.giftSource as "wishlist" | "ai" | "both" | "specific",
          categories: [],
          exclude_items: [],
          recipient_preferences: null
        },
        relationship_context: {
          relationship_type: setupData.recipient.relationshipType,
          connection_status: setupData.recipient.connectionStatus
        }
      };

      await unifiedGiftManagementService.createRule(ruleData);

      toast.success("🎁 Auto-gifting set up successfully!", {
        description: setupData.recipient.pendingInvitation 
          ? "Will activate when your friend joins"
          : "Your auto-gift rule is now active"
      });

      onComplete();
    } catch (error) {
      console.error("Error creating auto-gift rule:", error);
      toast.error("Failed to set up auto-gifting. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="flex items-center justify-between">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step <= currentStep 
                ? "bg-primary text-white" 
                : "bg-muted text-muted-foreground"
            }`}>
              {step < currentStep ? <CheckCircle className="h-4 w-4" /> : step}
            </div>
            {step < 3 && (
              <div className={`h-1 w-16 mx-2 ${
                step < currentStep ? "bg-primary" : "bg-muted"
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="p-6">
          {currentStep === 1 && (
            <div className="space-y-4">
              <UnifiedRecipientSelector
                value={setupData.recipient.connectionId || ""}
                onChange={handleRecipientChange}
                selectedRecipient={setupData.recipient}
              />
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <Label className="text-base font-medium">Step 2: When should we send gifts?</Label>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Choose the occasion</span>
                </div>

                <Select 
                  value={setupData.timing.dateType} 
                  onValueChange={(value) => handleTimingChange("dateType", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="birthday">Birthday</SelectItem>
                    <SelectItem value="anniversary">Anniversary</SelectItem>
                    <SelectItem value="holiday">Holiday</SelectItem>
                    <SelectItem value="other">Other Special Day</SelectItem>
                  </SelectContent>
                </Select>

                {setupData.timing.dateType === "other" && (
                  <div>
                    <Label htmlFor="customDate">Specific Date</Label>
                    <Input
                      id="customDate"
                      type="date"
                      value={setupData.timing.customDate || ""}
                      onChange={(e) => handleTimingChange("customDate", e.target.value)}
                    />
                  </div>
                )}

                <div className="bg-blue-50 p-3 rounded-lg text-sm">
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900">Smart Timing</p>
                      <p className="text-blue-700">
                        We'll automatically send gifts a few days before the occasion 
                        to ensure they arrive on time.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <Label className="text-base font-medium">Step 3: Budget & Gift Preferences</Label>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <DollarSign className="h-4 w-4" />
                    <span>Budget per gift</span>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {[25, 50, 100, 150].map((amount) => (
                      <Button
                        key={amount}
                        variant={setupData.budget.amount === amount ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleBudgetChange("amount", amount)}
                      >
                        ${amount}
                      </Button>
                    ))}
                  </div>
                  
                  <Input
                    type="number"
                    value={setupData.budget.amount}
                    onChange={(e) => handleBudgetChange("amount", parseInt(e.target.value) || 0)}
                    placeholder="Custom amount"
                    min="1"
                    max="500"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Gift className="h-4 w-4" />
                    <span>Gift selection method</span>
                  </div>
                  
                  <Select 
                    value={setupData.budget.giftSource} 
                    onValueChange={(value) => handleBudgetChange("giftSource", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wishlist">From their wishlist (best option)</SelectItem>
                      <SelectItem value="ai">AI recommendations</SelectItem>
                      <SelectItem value="both">Wishlist + AI backup</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Summary */}
                <Separator />
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-medium text-green-900 mb-2">Auto-Gift Summary</h3>
                  <div className="space-y-1 text-sm text-green-800">
                    <p><strong>Who:</strong> {setupData.recipient.recipientName}</p>
                    <p><strong>When:</strong> {setupData.timing.dateType}</p>
                    <p><strong>Budget:</strong> ${setupData.budget.amount}</p>
                    <p><strong>Source:</strong> {setupData.budget.giftSource}</p>
                  </div>
                  {setupData.recipient.pendingInvitation && (
                    <Badge variant="outline" className="mt-2">
                      Will activate when they join
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="flex gap-2">
          {currentStep < 3 ? (
            <Button
              onClick={nextStep}
              disabled={
                (currentStep === 1 && !canProceedToStep2) ||
                (currentStep === 2 && !canProceedToStep3)
              }
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={!canComplete || isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? "Setting up..." : "Complete Setup"}
              <CheckCircle className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnifiedQuickSetup;