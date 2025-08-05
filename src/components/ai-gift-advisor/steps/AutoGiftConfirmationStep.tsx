import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle2, 
  Calendar, 
  DollarSign, 
  Bell, 
  Gift, 
  Edit2,
  Sparkles,
  Heart
} from "lucide-react";
import { useGiftAdvisorBot } from "../hooks/useGiftAdvisorBot";
import { useAutoGifting } from "@/hooks/useAutoGifting";
import { toast } from "sonner";

type AutoGiftConfirmationStepProps = ReturnType<typeof useGiftAdvisorBot>;

const AutoGiftConfirmationStep = ({ 
  botState,
  nextStep,
  resetBot
}: AutoGiftConfirmationStepProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const { createRule } = useAutoGifting();

  const recipient = botState.selectedFriend;
  const occasion = botState.occasion || 'birthday';
  const budget = botState.budget || { min: 50, max: 75 };

  const handleConfirmSetup = async () => {
    setIsCreating(true);
    
    try {
      // Create the auto-gifting rule
      await createRule({
        recipient_id: recipient.connected_user_id || recipient.id,
        date_type: occasion,
        budget_limit: budget.max,
        is_active: true,
        notification_preferences: {
          enabled: true,
          days_before: [7, 3, 1],
          email: true,
          push: true
        },
        gift_selection_criteria: {
          source: "wishlist",
          max_price: budget.max,
          min_price: budget.min,
          categories: [],
          exclude_items: [],
          preferred_brands: []
        }
      });

      toast.success("Auto-gifting set up successfully!");
      nextStep("auto-gift-success");
      
    } catch (error) {
      console.error('Error creating auto-gift rule:', error);
      toast.error("Failed to set up auto-gifting. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleEdit = () => {
    // Go back to manual configuration
    nextStep("occasion");
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-semibold">Nicole's Auto-Gift Setup</h2>
        </div>
        <p className="text-muted-foreground">
          Perfect! Here's what Nicole configured for you based on your relationship
        </p>
      </div>

      <Card className="border-2 border-primary/20">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src="" />
              <AvatarFallback>
                {(recipient?.connected_user_id || 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">
                {recipient?.connected_user_id || 'Unknown User'}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {recipient?.relationshipStrength || 'friend'}
                </Badge>
                {recipient?.hasWishlist && (
                  <Badge variant="outline" className="text-xs flex items-center gap-1">
                    <Heart className="w-3 h-3" />
                    Wishlist available
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Occasion */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium">Occasion</p>
                <p className="text-sm text-muted-foreground">
                  {occasion.charAt(0).toUpperCase() + occasion.slice(1)} gifts
                </p>
              </div>
            </div>
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          </div>

          <Separator />

          {/* Budget */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium">Budget Range</p>
                <p className="text-sm text-muted-foreground">
                  ${budget.min} - ${budget.max} (optimized for {recipient?.relationshipStrength || 'friends'})
                </p>
              </div>
            </div>
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          </div>

          <Separator />

          {/* Notifications */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium">Smart Notifications</p>
                <p className="text-sm text-muted-foreground">
                  7, 3, and 1 days before {occasion}
                </p>
              </div>
            </div>
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          </div>

          <Separator />

          {/* Gift Selection */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <Gift className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium">Gift Selection Strategy</p>
                <p className="text-sm text-muted-foreground">
                  {recipient?.hasWishlist ? 'Wishlist first, then AI recommendations' : 'AI-powered recommendations based on preferences'}
                </p>
              </div>
            </div>
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          </div>
        </CardContent>
      </Card>

      {/* Nicole's Intelligence Summary */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="font-medium text-sm">Nicole's Analysis</p>
              <p className="text-sm text-muted-foreground">
                Based on your relationship as {recipient?.relationshipStrength || 'friends'}, I've optimized the budget and notification timing. 
                {recipient?.hasWishlist ? ' Since they have a wishlist, I\'ll prioritize those items for the most meaningful gifts.' : ' I\'ll use AI to find gifts that match their preferences and interests.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1"
          onClick={handleEdit}
          disabled={isCreating}
        >
          <Edit2 className="w-4 h-4 mr-2" />
          Customize Setup
        </Button>
        
        <Button
          className="flex-1"
          onClick={handleConfirmSetup}
          disabled={isCreating}
        >
          {isCreating ? (
            <>
              <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Confirm Setup
            </>
          )}
        </Button>
      </div>

      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          You can modify or disable auto-gifting anytime from your dashboard
        </p>
      </div>
    </div>
  );
};

export default AutoGiftConfirmationStep;