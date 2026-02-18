import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, Users, Target, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";
import {
  getSuggestedContributions,
  canUserContribute,
  type GroupGiftProject
} from "@/services/groupGiftPaymentService";

interface ContributionFormProps {
  project: GroupGiftProject;
  onSuccess: () => void;
  onCancel: () => void;
}

const ContributionForm = ({ project, onSuccess, onCancel }: ContributionFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [contributionAmount, setContributionAmount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [canContribute, setCanContribute] = useState(true);
  const [contributionReason, setContributionReason] = useState<string>("");

  const remainingAmount = Math.max(0, project.target_amount - project.current_amount);
  const suggestedAmounts = getSuggestedContributions(
    project.target_amount,
    project.current_amount,
    5 // Estimate member count
  );

  useEffect(() => {
    const checkEligibility = async () => {
      if (!user) return;
      
      const result = await canUserContribute(user.id, project.id);
      setCanContribute(result.canContribute);
      if (!result.canContribute && result.reason) {
        setContributionReason(result.reason);
      }
    };

    checkEligibility();
  }, [user, project.id]);

  const handleContribute = async () => {
    if (!user) return;
    
    if (contributionAmount < 5) {
      toast("Minimum contribution is $5");
      return;
    }
    if (contributionAmount > remainingAmount) {
      toast(`Maximum contribution is $${remainingAmount.toFixed(2)}`);
      return;
    }

    setIsProcessing(true);

    try {
      // NEW: Create checkout session for group gift
      console.log('🎁 Creating group gift contribution checkout session');
      
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          isGroupGift: true,
          groupGiftProjectId: project.id,
          contributionAmount: contributionAmount,
          pricingBreakdown: {
            subtotal: contributionAmount,
            shippingCost: 0,
            giftingFee: 0,
            taxAmount: 0,
          },
          metadata: {
            user_id: user.id,
            payment_method: 'card',
          }
        }
      });

      if (error) throw error;

      // Redirect to Stripe Checkout
      if (data.url) {
        console.log('✅ Redirecting to Stripe checkout for group gift');
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
      
      onSuccess();
    } catch (error) {
      console.error('Contribution error:', error);
      toast(error instanceof Error ? error.message : "An unexpected error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!canContribute) {
    return (
      <div className="p-6 text-center">
        <div className="mb-4">
          <Badge variant="secondary" className="mb-2">Cannot Contribute</Badge>
          <p className="text-muted-foreground">{contributionReason}</p>
        </div>
        <Button onClick={onCancel} variant="outline">Close</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Project Overview */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-4">
            {project.target_product_image && (
              <img 
                src={project.target_product_image} 
                alt={project.target_product_name || project.project_name}
                className="w-16 h-16 object-cover rounded-lg"
              />
            )}
            <div className="flex-1">
              <h3 className="font-semibold">{project.project_name}</h3>
              {project.target_product_name && (
                <p className="text-sm text-muted-foreground">{project.target_product_name}</p>
              )}
            </div>
          </div>

          {/* Funding Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>${project.current_amount.toFixed(2)} / ${project.target_amount.toFixed(2)}</span>
            </div>
            <Progress 
              value={(project.current_amount / project.target_amount) * 100} 
              className="h-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                ${remainingAmount.toFixed(2)} remaining
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {project.group_gift_contributions?.filter(c => c.contribution_status === 'paid').length || 0} contributors
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suggested Amounts */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Suggested Contributions</Label>
        <div className="grid grid-cols-2 gap-2">
          {suggestedAmounts.map((amount) => (
            <Button
              key={amount}
              variant={contributionAmount === amount ? "default" : "outline"}
              size="sm"
              onClick={() => setContributionAmount(amount)}
              className="justify-center"
            >
              ${amount.toFixed(2)}
            </Button>
          ))}
        </div>
      </div>

      {/* Custom Amount */}
      <div>
        <Label htmlFor="custom-amount" className="text-sm font-medium">
          Custom Amount
        </Label>
        <div className="relative mt-1">
          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="custom-amount"
            type="number"
            min="5"
            max={remainingAmount}
            step="0.01"
            placeholder="0.00"
            value={contributionAmount || ""}
            onChange={(e) => setContributionAmount(parseFloat(e.target.value) || 0)}
            className="pl-9"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Minimum: $5.00 • Maximum: ${remainingAmount.toFixed(2)}
        </p>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
        <p className="text-xs text-blue-800 dark:text-blue-200">
          🔒 Your payment is held securely until the funding goal is reached. You'll be redirected to Stripe's secure checkout.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button 
          onClick={onCancel} 
          variant="outline" 
          className="flex-1"
          disabled={isProcessing}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleContribute}
          className="flex-1"
          disabled={!contributionAmount || contributionAmount < 5 || isProcessing}
        >
          {isProcessing ? "Processing..." : `Contribute $${contributionAmount.toFixed(2)}`}
        </Button>
      </div>
    </div>
  );
};

interface GroupGiftContributionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: GroupGiftProject | null;
  onContributionSuccess?: () => void;
}

const GroupGiftContributionModal = ({
  open,
  onOpenChange,
  project,
  onContributionSuccess
}: GroupGiftContributionModalProps) => {
  const handleSuccess = () => {
    onOpenChange(false);
    onContributionSuccess?.();
  };

  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Contribute to Group Gift
          </DialogTitle>
        </DialogHeader>
        
        <ContributionForm
          project={project}
          onSuccess={handleSuccess}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
};

export default GroupGiftContributionModal;