import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Mail, Heart, Users, Gift } from "lucide-react";
import { useGiftAdvisorBot } from "../hooks/useGiftAdvisorBot";

type InvitationSentStepProps = ReturnType<typeof useGiftAdvisorBot>;

const InvitationSentStep = ({ 
  nextStep, 
  closeBot,
  botState 
}: InvitationSentStepProps) => {
  const invitedFriend = botState.invitedFriend;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-elyphant-success" />
        </div>
        
        <div>
          <h2 className="text-xl font-semibold">Invitation Sent! 🎉</h2>
          <p className="text-muted-foreground">
            {invitedFriend?.name} will receive a personalized invitation to join Elyphant
          </p>
        </div>
      </div>

      <Card className="border-2 border-border bg-muted">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-elyphant-success" />
            <h3 className="font-semibold text-foreground">What happens next?</h3>
          </div>
          
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-semibold text-green-600">1</span>
              </div>
              <div>
                <p className="font-medium">{invitedFriend?.name} receives your invitation</p>
                <p className="text-muted-foreground">They'll see a personalized message explaining auto-gifting</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-semibold text-green-600">2</span>
              </div>
              <div>
                <p className="font-medium">They create their profile and wishlist</p>
                <p className="text-muted-foreground">Nicole will guide them through preference setup</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-semibold text-green-600">3</span>
              </div>
              <div>
                <p className="font-medium">Auto-gifting activates automatically</p>
                <p className="text-muted-foreground">Perfect gifts will be sent for their occasions</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {invitedFriend?.occasion && (
        <Card className="border-2 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Gift className="w-4 h-4 text-primary" />
              <h4 className="font-medium">Auto-Gift Setup Ready</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              When {invitedFriend.name} joins, auto-gifting will be activated for their {invitedFriend.occasion} 
              with your personalized preferences.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <h4 className="font-medium text-center">What would you like to do next?</h4>
        
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            onClick={() => nextStep("invite-new-friend")}
            className="h-auto p-4 flex flex-col items-center gap-2"
          >
            <Users className="w-5 h-5" />
            <span className="text-sm">Invite Another Friend</span>
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => nextStep("nicole-auto-gift-connection")}
            className="h-auto p-4 flex flex-col items-center gap-2"
          >
            <Heart className="w-5 h-5" />
            <span className="text-sm">Set Up More Auto-Gifts</span>
          </Button>
        </div>
        
        <Button 
          onClick={closeBot}
          className="w-full"
        >
          Done for Now
        </Button>
      </div>
    </div>
  );
};

export default InvitationSentStep;