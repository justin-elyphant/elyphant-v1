
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Gift, Award, Star } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { useLocalStorage } from "@/components/gifting/hooks/useLocalStorage";

interface LoyaltyData {
  points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  nextTierPoints: number;
  history: {
    date: string;
    description: string;
    points: number;
  }[];
  availableRewards: {
    id: string;
    name: string;
    description: string;
    pointsCost: number;
    isAvailable: boolean;
  }[];
}

const mockLoyaltyData: LoyaltyData = {
  points: 325,
  tier: 'silver',
  nextTierPoints: 500,
  history: [
    { date: '2024-05-01', description: 'Purchase: Wireless Headphones', points: 45 },
    { date: '2024-04-15', description: 'Product Review', points: 10 },
    { date: '2024-03-28', description: 'Friend Referral', points: 100 },
    { date: '2024-03-10', description: 'Purchase: Yoga Mat', points: 20 },
    { date: '2024-02-22', description: 'Birthday Bonus', points: 50 },
    { date: '2024-02-14', description: 'Purchase: Smartwatch', points: 100 },
  ],
  availableRewards: [
    { id: 'r1', name: '$5 Gift Credit', description: 'Get $5 off your next purchase', pointsCost: 100, isAvailable: true },
    { id: 'r2', name: 'Free Shipping', description: 'Free shipping on your next order', pointsCost: 150, isAvailable: true },
    { id: 'r3', name: '$15 Gift Credit', description: 'Get $15 off your next purchase', pointsCost: 350, isAvailable: false },
    { id: 'r4', name: 'Early Access', description: 'Early access to new products and sales', pointsCost: 500, isAvailable: false },
  ]
};

interface LoyaltyPointsProps {
  expanded?: boolean;
}

const LoyaltyPoints = ({ expanded = false }: LoyaltyPointsProps) => {
  const { user } = useAuth();
  const [loyaltyData, setLoyaltyData] = useLocalStorage<LoyaltyData>("loyalty_data", mockLoyaltyData);
  
  const tierColors = {
    bronze: "text-amber-700",
    silver: "text-slate-400",
    gold: "text-amber-400",
    platinum: "text-purple-600"
  };
  
  const tierBackgrounds = {
    bronze: "bg-amber-100",
    silver: "bg-slate-100",
    gold: "bg-amber-50",
    platinum: "bg-purple-50"
  };
  
  const tierProgress = {
    bronze: { min: 0, max: 250 },
    silver: { min: 250, max: 500 },
    gold: { min: 500, max: 1000 },
    platinum: { min: 1000, max: 1000 }
  };
  
  const currentTierProgress = loyaltyData.points - tierProgress[loyaltyData.tier].min;
  const totalTierPoints = tierProgress[loyaltyData.tier].max - tierProgress[loyaltyData.tier].min;
  const progressPercentage = (currentTierProgress / totalTierPoints) * 100;
  
  const handleRedeemReward = (rewardId: string) => {
    const reward = loyaltyData.availableRewards.find(r => r.id === rewardId);
    
    if (!reward) return;
    
    if (loyaltyData.points >= reward.pointsCost) {
      setLoyaltyData({
        ...loyaltyData,
        points: loyaltyData.points - reward.pointsCost,
        history: [
          {
            date: new Date().toISOString().split('T')[0],
            description: `Redeemed: ${reward.name}`,
            points: -reward.pointsCost
          },
          ...loyaltyData.history
        ]
      });
    }
  };
  
  if (!expanded) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg bg-white border shadow-sm">
        <div className={`p-2 rounded-full ${tierBackgrounds[loyaltyData.tier]}`}>
          <Award className={`h-5 w-5 ${tierColors[loyaltyData.tier]}`} />
        </div>
        <div>
          <p className="text-sm font-medium">
            <span className="font-bold">{loyaltyData.points}</span> Reward Points
          </p>
          <p className="text-xs text-muted-foreground capitalize">{loyaltyData.tier} Tier</p>
        </div>
      </div>
    );
  }
  
  return (
    <Card className={`border-2 ${tierBackgrounds[loyaltyData.tier]}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className={`h-5 w-5 ${tierColors[loyaltyData.tier]}`} />
          <span>Rewards & Points</span>
        </CardTitle>
        <CardDescription>
          Earn points with purchases and activities
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Points balance and tier */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <p className="text-sm text-muted-foreground">Your balance</p>
            <p className="text-3xl font-bold">{loyaltyData.points} points</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Member tier</p>
            <p className={`text-lg font-medium capitalize ${tierColors[loyaltyData.tier]}`}>
              {loyaltyData.tier}
            </p>
          </div>
        </div>
        
        {/* Tier progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <p>Tier Progress</p>
            <p>{loyaltyData.points} / {tierProgress[loyaltyData.tier].max} points</p>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {loyaltyData.tier !== 'platinum' ? (
              <>
                {tierProgress[loyaltyData.tier].max - loyaltyData.points} more points until {loyaltyData.tier === 'bronze' ? 'Silver' : loyaltyData.tier === 'silver' ? 'Gold' : 'Platinum'} tier
              </>
            ) : (
              <>You've reached the highest tier!</>
            )}
          </p>
        </div>
        
        {/* Available rewards */}
        <div className="space-y-2 mt-4">
          <h3 className="font-medium">Available Rewards</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {loyaltyData.availableRewards.map((reward) => (
              <div 
                key={reward.id} 
                className={`p-3 rounded-lg border ${reward.isAvailable && loyaltyData.points >= reward.pointsCost 
                  ? 'bg-white' 
                  : 'bg-gray-50'}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{reward.name}</p>
                    <p className="text-xs text-muted-foreground">{reward.description}</p>
                  </div>
                  <div className="flex items-center text-sm font-medium">
                    <Star className="h-3 w-3 mr-1 text-amber-500" />
                    {reward.pointsCost}
                  </div>
                </div>
                <div className="mt-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    disabled={!reward.isAvailable || loyaltyData.points < reward.pointsCost}
                    onClick={() => handleRedeemReward(reward.id)}
                  >
                    {reward.isAvailable && loyaltyData.points >= reward.pointsCost 
                      ? "Redeem" 
                      : `Need ${reward.pointsCost - loyaltyData.points} more`}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Transaction history */}
        <div className="space-y-2 mt-4">
          <h3 className="font-medium">Recent Activity</h3>
          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Activity</th>
                  <th className="text-right p-2">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loyaltyData.history.slice(0, 5).map((item, index) => (
                  <tr key={index} className="hover:bg-muted/50">
                    <td className="p-2">{item.date}</td>
                    <td className="p-2">{item.description}</td>
                    <td className={`p-2 text-right ${item.points >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {item.points >= 0 ? '+' : ''}{item.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2 text-sm text-muted-foreground">
        <p>How to earn more points:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Purchase gifts (1 point per $1 spent)</li>
          <li>Write product reviews (10 points each)</li>
          <li>Refer friends (100 points per friend)</li>
          <li>Complete your profile (50 points)</li>
        </ul>
      </CardFooter>
    </Card>
  );
};

export default LoyaltyPoints;
