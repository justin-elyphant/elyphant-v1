
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatDistanceToNow } from "date-fns";
import { Users, Calendar, Tag } from "lucide-react";
import { Link } from "react-router-dom";
import { FundingCampaign } from '@/utils/crowdfundingService';
import { Badge } from "@/components/ui/badge";

interface CampaignCardProps {
  campaign: FundingCampaign;
  contributorsCount: number;
}

const CampaignCard: React.FC<CampaignCardProps> = ({ campaign, contributorsCount }) => {
  // Calculate the percentage of the goal reached
  const percentFunded = Math.min(
    Math.round((campaign.current_amount / campaign.goal_amount) * 100),
    100
  );
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Get campaign type badge color
  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'wedding':
        return 'bg-pink-100 text-pink-800';
      case 'graduation':
        return 'bg-indigo-100 text-indigo-800';
      case 'birthday':
        return 'bg-yellow-100 text-yellow-800';
      case 'product':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <Badge 
            variant="outline"
            className={`mb-2 ${getTypeBadgeColor(campaign.campaign_type)}`}
          >
            {campaign.campaign_type.charAt(0).toUpperCase() + campaign.campaign_type.slice(1)}
          </Badge>
          
          {campaign.end_date && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Calendar className="h-3 w-3 mr-1" />
              {formatDistanceToNow(new Date(campaign.end_date), { addSuffix: true })}
            </div>
          )}
        </div>
        
        <CardTitle className="line-clamp-2">{campaign.title}</CardTitle>
        <CardDescription className="line-clamp-2">
          {campaign.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">{formatCurrency(campaign.current_amount)}</span>
            <span className="text-muted-foreground">of {formatCurrency(campaign.goal_amount)}</span>
          </div>
          <Progress value={percentFunded} className="h-2" />
        </div>
        
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1" />
            <span>{contributorsCount} contributors</span>
          </div>
          
          {campaign.product_id && (
            <div className="flex items-center">
              <Tag className="h-4 w-4 mr-1" />
              <span>Product linked</span>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter>
        <Button asChild className="w-full">
          <Link to={`/funding/${campaign.id}`}>
            View Campaign
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CampaignCard;
