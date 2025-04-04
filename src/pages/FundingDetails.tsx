
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { ArrowLeft, Share2, Calendar, Users, ShoppingBag, ExternalLink, Heart } from "lucide-react";
import { fetchCampaignById, fetchCampaignContributions, subscribeToCampaignUpdates, FundingCampaign, Contribution } from "@/utils/crowdfundingService";
import ContributeDialog from "@/components/crowdfunding/ContributeDialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const FundingDetails = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [campaign, setCampaign] = useState<FundingCampaign | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showContributeDialog, setShowContributeDialog] = useState(false);
  
  useEffect(() => {
    const loadCampaignDetails = async () => {
      if (!campaignId) return;
      
      setIsLoading(true);
      const campaignData = await fetchCampaignById(campaignId);
      if (!campaignData) {
        navigate('/funding');
        return;
      }
      
      setCampaign(campaignData);
      
      const contributionsData = await fetchCampaignContributions(campaignId);
      setContributions(contributionsData);
      
      setIsLoading(false);
    };
    
    loadCampaignDetails();
  }, [campaignId, navigate]);
  
  // Subscribe to real-time updates
  useEffect(() => {
    if (!campaignId) return;
    
    const unsubscribe = subscribeToCampaignUpdates(
      campaignId,
      (updatedCampaign) => {
        setCampaign(updatedCampaign);
      },
      (newContribution) => {
        setContributions(prev => [newContribution, ...prev]);
      }
    );
    
    return unsubscribe;
  }, [campaignId]);
  
  const handleContribute = () => {
    if (!user) {
      navigate('/sign-in');
      return;
    }
    setShowContributeDialog(true);
  };
  
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Campaign link copied to clipboard");
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  // Calculate percentage funded
  const percentFunded = campaign 
    ? Math.min(Math.round((campaign.current_amount / campaign.goal_amount) * 100), 100) 
    : 0;
  
  // Get unique contributors count
  const contributorsCount = contributions 
    ? new Set(contributions.map(c => c.contributor_id)).size 
    : 0;
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-center">
          <div className="w-full max-w-4xl">
            <div className="h-32 bg-muted rounded-t-md animate-pulse" />
            <div className="h-64 bg-muted/50 rounded-b-md animate-pulse mt-4" />
          </div>
        </div>
      </div>
    );
  }
  
  if (!campaign) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Button 
        variant="ghost" 
        onClick={() => navigate('/funding')} 
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to campaigns
      </Button>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Campaign Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <Badge variant="outline" className="mb-2">
                  {campaign.campaign_type.charAt(0).toUpperCase() + campaign.campaign_type.slice(1)}
                </Badge>
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-2" /> Share
                </Button>
              </div>
              <CardTitle className="text-2xl">{campaign.title}</CardTitle>
              <CardDescription>
                Created {format(new Date(campaign.created_at), 'MMM d, yyyy')}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Funding Progress */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-semibold text-xl">
                    {formatCurrency(campaign.current_amount)}
                  </span>
                  <span className="text-muted-foreground">
                    Goal: {formatCurrency(campaign.goal_amount)}
                  </span>
                </div>
                <Progress value={percentFunded} className="h-2" />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{percentFunded}% Funded</span>
                  {campaign.end_date && (
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Ends {format(new Date(campaign.end_date), 'MMM d, yyyy')}
                    </span>
                  )}
                </div>
              </div>
              
              <Button onClick={handleContribute} className="w-full">
                Contribute to this Campaign
              </Button>
              
              <Separator />
              
              {/* Campaign Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{contributorsCount}</p>
                    <p className="text-xs text-muted-foreground">Contributors</p>
                  </div>
                </div>
                
                {campaign.product_id && (
                  <div className="flex items-center">
                    <ShoppingBag className="h-5 w-5 mr-2 text-muted-foreground" />
                    <div>
                      <Button 
                        variant="link" 
                        className="h-auto p-0 font-medium" 
                        onClick={() => navigate(`/marketplace?productId=${campaign.product_id}`)}
                      >
                        View Product <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                      <p className="text-xs text-muted-foreground">Linked item</p>
                    </div>
                  </div>
                )}
              </div>
              
              <Separator />
              
              {/* Campaign Description */}
              <div>
                <h3 className="font-medium mb-2">About this Campaign</h3>
                <p className="whitespace-pre-line">{campaign.description}</p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Contributions List */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Contributions</CardTitle>
            </CardHeader>
            <CardContent>
              {contributions.length > 0 ? (
                <div className="space-y-4">
                  {contributions.map((contribution) => (
                    <div key={contribution.id} className="flex items-start space-x-4 py-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {contribution.is_anonymous ? 
                            <Heart className="h-4 w-4" /> : 
                            contribution.contributor_id.substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <p className="font-medium">
                            {contribution.is_anonymous ? "Anonymous" : `Contributor ${contribution.contributor_id.substring(0, 6)}`}
                          </p>
                          <p className="font-medium">{formatCurrency(contribution.amount)}</p>
                        </div>
                        {contribution.message && (
                          <p className="text-sm text-muted-foreground mt-1">{contribution.message}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(contribution.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <p>No contributions yet.</p>
                  <p>Be the first to contribute!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Contribute Dialog */}
      <ContributeDialog
        open={showContributeDialog}
        onOpenChange={setShowContributeDialog}
        campaignId={campaign.id}
        campaignTitle={campaign.title}
      />
    </div>
  );
};

export default FundingDetails;
