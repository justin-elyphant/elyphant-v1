import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Gift, 
  Users, 
  Heart, 
  Sparkles, 
  Trophy,
  Target,
  Zap,
  Star
} from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const ViralMechanicsCenter = () => {
  const { user } = useAuth();
  const [selectedReward, setSelectedReward] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [rewardValue, setRewardValue] = useState('');

  const handleCreateReward = async () => {
    if (!user || !selectedReward) {
      toast.error("Please select a reward type");
      return;
    }

    try {
      // This would typically be tied to actual invitation events
      const { error } = await supabase
        .from('invitation_rewards')
        .insert({
          user_id: user.id,
          invitation_id: 'demo-invitation-id', // Would be actual invitation ID
          reward_type: selectedReward,
          reward_value: parseFloat(rewardValue) || 0,
          reward_description: customMessage,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        });

      if (error) throw error;

      toast.success("Reward created successfully!");
      setSelectedReward('');
      setCustomMessage('');
      setRewardValue('');
    } catch (error) {
      console.error('Error creating reward:', error);
      toast.error("Failed to create reward");
    }
  };

  const rewardTypes = [
    {
      id: 'referral_bonus',
      name: 'Referral Bonus',
      description: 'Get $10 credit for each successful invitation',
      icon: Gift,
      color: 'text-green-500'
    },
    {
      id: 'premium_unlock',
      name: 'Premium Features',
      description: 'Unlock premium AI features for 3 months',
      icon: Star,
      color: 'text-yellow-500'
    },
    {
      id: 'free_auto_gift',
      name: 'Free Auto-Gift',
      description: 'Get one free auto-gift execution',
      icon: Heart,
      color: 'text-red-500'
    },
    {
      id: 'community_badge',
      name: 'Community Badge',
      description: 'Earn exclusive community recognition',
      icon: Trophy,
      color: 'text-purple-500'
    }
  ];

  const viralCampaigns = [
    {
      title: "Holiday Invitation Blitz",
      description: "Invite 5 friends for the holidays and unlock premium features",
      target: 5,
      current: 2,
      reward: "3 months premium",
      deadline: "Dec 20, 2024",
      status: "active"
    },
    {
      title: "Birthday Squad Builder",
      description: "Build your birthday gifting network",
      target: 3,
      current: 1,
      reward: "$25 gift credit",
      deadline: "Jan 31, 2025",
      status: "active"
    },
    {
      title: "Family Circle Complete",
      description: "Connect all your family members",
      target: 4,
      current: 4,
      reward: "Free family plan",
      deadline: "Completed",
      status: "completed"
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="w-6 h-6 text-yellow-500" />
            Viral Mechanics Center
          </h1>
          <p className="text-muted-foreground">
            Boost your invitation success with rewards and campaigns
          </p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          Phase 5 Enhancement
        </Badge>
      </div>

      {/* Active Campaigns */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Target className="w-5 h-5" />
            Active Campaigns
          </h3>
          <p className="text-sm text-muted-foreground">
            Complete challenges to earn rewards and boost your gifting network
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {viralCampaigns.map((campaign, index) => (
            <div key={index} className="p-4 border rounded-lg">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-medium">{campaign.title}</h4>
                  <p className="text-sm text-muted-foreground">{campaign.description}</p>
                </div>
                <Badge variant={campaign.status === 'completed' ? 'default' : 'secondary'}>
                  {campaign.status}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-sm">
                    <span className="font-medium">{campaign.current}</span> / {campaign.target} invitations
                  </div>
                  <div className="w-32 bg-muted rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-primary" 
                      style={{ width: `${(campaign.current / campaign.target) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-green-600">{campaign.reward}</p>
                  <p className="text-xs text-muted-foreground">{campaign.deadline}</p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Reward Types */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Gift className="w-5 h-5" />
            Available Rewards
          </h3>
          <p className="text-sm text-muted-foreground">
            Earn these rewards by successfully inviting friends to join Elyphant
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {rewardTypes.map((reward) => {
              const Icon = reward.icon;
              return (
                <div 
                  key={reward.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    selectedReward === reward.id ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => setSelectedReward(reward.id)}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className={`w-5 h-5 ${reward.color}`} />
                    <h4 className="font-medium">{reward.name}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">{reward.description}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Reciprocal Gifting Engine */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Heart className="w-5 h-5" />
            Reciprocal Gifting Engine
          </h3>
          <p className="text-sm text-muted-foreground">
            Turn giftees into gifters with smart reciprocal suggestions
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Thank You Gifts</h4>
              <p className="text-sm text-blue-600">
                Suggest small thank you gifts for new giftees to send back to their inviters
              </p>
            </div>
            
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">Occasion Reminders</h4>
              <p className="text-sm text-green-600">
                Notify new users about their giftor's upcoming birthdays and occasions
              </p>
            </div>

            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h4 className="font-medium text-purple-800 mb-2">Mutual Connections</h4>
              <p className="text-sm text-purple-600">
                Help new users discover mutual friends and build their gifting network
              </p>
            </div>
          </div>

          <div className="p-4 border rounded-lg bg-gradient-to-r from-primary/5 to-secondary/5">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h4 className="font-medium">Smart Suggestions</h4>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Nicole automatically suggests reciprocal gifts based on relationship context and gifting history
            </p>
            <Button size="sm" variant="outline">
              Configure Smart Suggestions
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Create Custom Reward */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Create Custom Reward</h3>
          <p className="text-sm text-muted-foreground">
            Design your own invitation rewards and incentives
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Reward Type</label>
              <Select value={selectedReward} onValueChange={setSelectedReward}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reward type" />
                </SelectTrigger>
                <SelectContent>
                  {rewardTypes.map((reward) => (
                    <SelectItem key={reward.id} value={reward.id}>
                      {reward.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Reward Value</label>
              <Input 
                placeholder="e.g., 25 for $25 credit"
                value={rewardValue}
                onChange={(e) => setRewardValue(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Custom Message</label>
            <Textarea 
              placeholder="Describe your custom reward..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
            />
          </div>

          <Button onClick={handleCreateReward} disabled={!selectedReward}>
            <Gift className="w-4 h-4 mr-2" />
            Create Reward
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ViralMechanicsCenter;