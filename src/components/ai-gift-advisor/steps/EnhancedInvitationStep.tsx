import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail, User, Heart, Calendar, ArrowRight, CheckCircle2, Send } from "lucide-react";
import { useGiftAdvisorBot } from "../hooks/useGiftAdvisorBot";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";

type EnhancedInvitationStepProps = ReturnType<typeof useGiftAdvisorBot>;

const EnhancedInvitationStep = ({
  nextStep,
  botState,
  setBudget,
  setOccasion
}: EnhancedInvitationStepProps) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: botState.pendingFriendData?.name || '',
    email: botState.pendingFriendData?.email || '',
    relationship: botState.pendingFriendData?.relationship || 'friend',
    occasion: '',
    personalMessage: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const firstName = user?.user_metadata?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSendInvitation = async () => {
    if (!formData.name || !formData.email || !formData.occasion) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);

    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase.functions.invoke('ecommerce-email-orchestrator', {
        body: {
          eventType: 'connection_invitation',
          customData: {
            recipientName: formData.name,
            recipientEmail: formData.email,
            senderName: 'Friend',
            relationship: formData.relationship,
            customMessage: formData.personalMessage
          }
        }
      });

      if (error) throw error;

      nextStep("invitation-sent", {
        invitedFriend: {
          name: formData.name,
          email: formData.email,
          relationship: formData.relationship,
          occasion: formData.occasion
        }
      });

      setOccasion(formData.occasion);
      setBudget({ min: 50, max: 100 });

      toast.success(`Invitation sent to ${formData.name}`);

      nextStep("invitation-sent");
    } catch (error) {
      console.error('Invitation sending error:', error);
      toast.error("Something went wrong sending the invitation. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const occasionOptions = [
    { value: 'birthday', label: 'Birthday', icon: '🎂' },
    { value: 'anniversary', label: 'Anniversary', icon: '💕' },
    { value: 'graduation', label: 'Graduation', icon: '🎓' },
    { value: 'wedding', label: 'Wedding', icon: '💒' },
    { value: 'holiday', label: 'Holiday', icon: '🎄' },
    { value: 'just_because', label: 'Just Because', icon: '💝' }
  ];

  const relationshipOptions = [
    { value: 'friend', label: 'Friend' },
    { value: 'family', label: 'Family' },
    { value: 'partner', label: 'Partner' },
    { value: 'colleague', label: 'Colleague' }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold">Hey {firstName}! Let's invite {formData.name || 'them'} to join</h2>
        <p className="text-muted-foreground">
          I don't see them on Elyphant yet, but no worries! I'll send them a personalized invitation to join so you can set up auto-gifting.
        </p>
      </div>

      <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-purple-50 to-indigo-50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="w-5 h-5 text-primary" />
            Invitation Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Their Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Sarah Johnson"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="border-primary/20 focus:border-primary"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Their Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="e.g., sarah@example.com"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="border-primary/20 focus:border-primary"
            />
          </div>

          {/* Relationship */}
          <div className="space-y-2">
            <Label>Your Relationship</Label>
            <div className="flex gap-2 flex-wrap">
              {relationshipOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={formData.relationship === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleInputChange('relationship', option.value)}
                  className="h-8"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Occasion */}
          <div className="space-y-2">
            <Label>What's the Occasion? *</Label>
            <div className="grid grid-cols-2 gap-2">
              {occasionOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={formData.occasion === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleInputChange('occasion', option.value)}
                  className="justify-start gap-2 h-10"
                >
                  <span>{option.icon}</span>
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Personal Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Personal Message (Optional)</Label>
            <Input
              id="message"
              placeholder={`Hey ${formData.name || '[Name]'}! I want to get you something amazing for your ${formData.occasion || '[occasion]'}...`}
              value={formData.personalMessage}
              onChange={(e) => handleInputChange('personalMessage', e.target.value)}
              className="border-primary/20 focus:border-primary"
            />
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      {formData.name && formData.email && formData.occasion && (
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-green-500 text-white">
                  {formData.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h4 className="font-medium">{formData.name}</h4>
                <p className="text-sm text-muted-foreground">
                  Will receive invitation for {formData.occasion} auto-gifting
                </p>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                {formData.relationship}
              </Badge>
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
          ← Back to Search
        </Button>
        <Button
          onClick={handleSendInvitation}
          disabled={!formData.name || !formData.email || !formData.occasion || isLoading}
          className="flex-1 gap-2"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          Send Invitation
        </Button>
      </div>
    </div>
  );
};

export default EnhancedInvitationStep;