import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CheckCircle2, Mail, Calendar, Heart, ArrowRight, Sparkles } from "lucide-react";
import { useGiftAdvisorBot } from "../hooks/useGiftAdvisorBot";
import { useAuth } from "@/contexts/auth";

type EnhancedInvitationSentStepProps = ReturnType<typeof useGiftAdvisorBot>;

const EnhancedInvitationSentStep = ({
  nextStep,
  botState
}: EnhancedInvitationSentStepProps) => {
  const { user } = useAuth();
  const invitedFriend = botState.invitedFriend;
  const firstName = user?.user_metadata?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

  if (!invitedFriend) {
    return (
      <div className="text-center">
        <p>No invitation data found.</p>
        <Button onClick={() => nextStep("nicole-auto-gift-connection")}>
          ← Back to Start
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-semibold">Perfect! Invitation sent to {invitedFriend.name}</h2>
        <p className="text-muted-foreground">
          They'll receive a personalized invitation and once they join, auto-gifting will be ready to go!
        </p>
      </div>

      {/* Invitation Summary */}
      <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="w-12 h-12">
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
                {invitedFriend.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold">{invitedFriend.name}</h3>
              <p className="text-sm text-muted-foreground">{invitedFriend.email}</p>
            </div>
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
              {invitedFriend.relationship}
            </Badge>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-green-500" />
              <span className="font-medium text-green-700">Invitation sent successfully</span>
            </div>
            
            {invitedFriend.occasion && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span>Auto-gifting set up for their {invitedFriend.occasion}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2 text-sm">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span>Nicole will handle gift selection once they join</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What Happens Next */}
      <Card className="border-dashed border-2">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <ArrowRight className="w-5 h-5 text-primary" />
            What happens next?
          </h3>
          
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-semibold">1</div>
              <div>
                <p className="font-medium">{invitedFriend.name} receives your invitation</p>
                <p className="text-sm text-muted-foreground">
                  They'll get a personalized email explaining how Elyphant works and why you invited them
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-semibold">2</div>
              <div>
                <p className="font-medium">They create their profile and preferences</p>
                <p className="text-sm text-muted-foreground">
                  Nicole will chat with them to understand their style, sizes, and favorite brands
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-semibold">3</div>
              <div>
                <p className="font-medium">Auto-gifting activates automatically</p>
                <p className="text-sm text-muted-foreground">
                  You'll both get notified and the gift selection process begins
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {invitedFriend.occasion && (
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-amber-800">
              <Calendar className="w-5 h-5" />
              <div>
                <p className="font-medium">
                  When {invitedFriend.name} joins, auto-gifting will be activated for their {invitedFriend.occasion}
                </p>
                <p className="text-sm text-amber-700">
                  You'll get a notification when it's time to review and approve the perfect gift
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => nextStep("nicole-auto-gift-connection")}
          className="flex-1"
        >
          Invite Someone Else
        </Button>
        <Button
          onClick={() => nextStep("welcome")}
          className="flex-1"
        >
          Done
        </Button>
      </div>
    </div>
  );
};

export default EnhancedInvitationSentStep;