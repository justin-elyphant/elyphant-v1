import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Mail, Heart, Gift, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { unifiedRecipientService } from "@/services/unifiedRecipientService";
import { useGiftAdvisorBot } from "../hooks/useGiftAdvisorBot";
import { useInvitationAnalytics } from "@/services/analytics/invitationAnalyticsService";

type InviteNewFriendStepProps = ReturnType<typeof useGiftAdvisorBot>;

const InviteNewFriendStep = ({ 
  nextStep, 
  setBudget, 
  setOccasion, 
  botState 
}: InviteNewFriendStepProps) => {
  const { user } = useAuth();
  const { trackInvitationSent } = useInvitationAnalytics();
  const [formData, setFormData] = useState({
    name: botState.pendingFriendData?.name || '',
    email: botState.pendingFriendData?.email || '',
    relationship: botState.pendingFriendData?.relationship || 'friend',
    occasion: '',
    eventDate: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateInvitation = async () => {
    if (!formData.name || !formData.email) {
      toast.error("Please provide both name and email");
      return;
    }

    if (!user) {
      toast.error("You must be logged in to send invitations");
      return;
    }

    setIsLoading(true);
    
    try {
      // Create pending recipient
      const pendingConnection = await unifiedRecipientService.createPendingRecipient({
        name: formData.name,
        email: formData.email,
        relationship_type: formData.relationship
      });

      // Track invitation analytics
      const invitationId = await trackInvitationSent({
        recipient_email: formData.email,
        recipient_name: formData.name,
        relationship_type: formData.relationship,
        occasion: formData.occasion,
        metadata: {
          event_date: formData.eventDate,
          source: 'ai_gift_advisor'
        }
      });

      // Set up occasion and budget if provided
      if (formData.occasion) {
        setOccasion(formData.occasion);
        
        // Set relationship-adjusted budget
        const baseBudget = 75;
        const relationshipMultiplier = formData.relationship === 'family' ? 1.2 : 
                                     formData.relationship === 'close_friend' ? 1.1 : 1.0;
        const suggestedBudget = Math.round(baseBudget * relationshipMultiplier);
        
        setBudget({ min: Math.round(suggestedBudget * 0.7), max: suggestedBudget });
      }

      // Send invitation email
      const emailResult = await sendInvitationEmail({
        recipientEmail: formData.email,
        recipientName: formData.name,
        giftorName: user.user_metadata?.name || user.email || 'Someone',
        occasion: formData.occasion,
        eventDate: formData.eventDate,
        relationship: formData.relationship,
        invitationId: invitationId // Pass invitation ID for tracking
      });

      toast.success(`Invitation sent to ${formData.name}! Auto-gifting will activate when they join.`);
      
      // Move to success/confirmation step
      nextStep("invitation-sent", {
        invitedFriend: {
          name: formData.name,
          email: formData.email,
          relationship: formData.relationship,
          occasion: formData.occasion
        }
      });

    } catch (error) {
      console.error('Error creating invitation:', error);
      toast.error("Failed to send invitation. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const sendInvitationEmail = async (invitationData: {
    recipientEmail: string;
    recipientName: string;
    giftorName: string;
    occasion?: string;
    eventDate?: string;
    relationship?: string;
    invitationId?: string;
  }) => {
    // Call orchestrator to send personalized invitation email
    const { data, error } = await supabase.functions.invoke('ecommerce-email-orchestrator', {
      body: {
        eventType: 'gift_invitation',
        customData: invitationData
      }
    });

    if (error) {
      throw new Error(error.message || 'Failed to send invitation email');
    }
    
    return data;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => nextStep("friend-search")}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h2 className="text-xl font-semibold">Invite Someone New</h2>
          <p className="text-muted-foreground">
            Invite them to join Elyphant and set up auto-gifting
          </p>
        </div>
      </div>

      <Card className="border-2 border-primary/20">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Gift Invitation Details</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Nicole will send a personalized invitation explaining how auto-gifting works
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Recipient Name</Label>
              <Input
                id="name"
                placeholder="Enter their name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="their@email.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="relationship">Relationship</Label>
            <Select value={formData.relationship} onValueChange={(value) => handleInputChange('relationship', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select relationship" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="friend">Friend</SelectItem>
                <SelectItem value="close_friend">Close Friend</SelectItem>
                <SelectItem value="family">Family Member</SelectItem>
                <SelectItem value="coworker">Coworker</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="occasion">Upcoming Occasion (Optional)</Label>
              <Select value={formData.occasion} onValueChange={(value) => handleInputChange('occasion', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select occasion" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="birthday">Birthday</SelectItem>
                  <SelectItem value="anniversary">Anniversary</SelectItem>
                  <SelectItem value="holiday">Holiday</SelectItem>
                  <SelectItem value="graduation">Graduation</SelectItem>
                  <SelectItem value="just_because">Just Because</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="eventDate">Event Date (Optional)</Label>
              <Input
                id="eventDate"
                type="date"
                value={formData.eventDate}
                onChange={(e) => handleInputChange('eventDate', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-primary mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-medium">What they'll receive:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• A personalized invitation from you</li>
                <li>• Explanation of how auto-gifting makes gift-giving effortless</li>
                <li>• Direct link to create their wishlist and preferences</li>
                <li>• Preview of the thoughtful gifts you have planned</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={() => nextStep("friend-search")}
        >
          Search Instead
        </Button>
        <Button 
          onClick={handleCreateInvitation}
          disabled={isLoading || !formData.name || !formData.email}
          className="flex-1"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Sending Invitation...
            </>
          ) : (
            <>
              <Mail className="w-4 h-4 mr-2" />
              Send Invitation
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default InviteNewFriendStep;