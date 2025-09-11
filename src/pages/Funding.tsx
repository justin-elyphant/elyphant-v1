
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { fetchActiveCampaigns, fetchCampaignContributions, FundingCampaign } from "@/utils/crowdfundingService";
import CampaignCard from "@/components/crowdfunding/CampaignCard";
import CreateCampaignDialog from "@/components/crowdfunding/CreateCampaignDialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const Funding = () => {
  const [campaigns, setCampaigns] = useState<FundingCampaign[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<FundingCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [campaignType, setCampaignType] = useState('all');
  const [contributorsCounts, setContributorsCounts] = useState<Record<string, number>>({});
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const loadCampaigns = async () => {
      setIsLoading(true);
      const data = await fetchActiveCampaigns();
      setCampaigns(data);
      setFilteredCampaigns(data);
      
      // Fetch contributors counts for each campaign
      const counts: Record<string, number> = {};
      for (const campaign of data) {
        const contributions = await fetchCampaignContributions(campaign.id);
        counts[campaign.id] = new Set(contributions.map(c => c.contributor_id)).size;
      }
      setContributorsCounts(counts);
      
      setIsLoading(false);
    };
    
    loadCampaigns();
  }, []);
  
  // Handle search and filter
  useEffect(() => {
    let filtered = campaigns;
    
    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        campaign => 
          campaign.title.toLowerCase().includes(search) || 
          campaign.description.toLowerCase().includes(search)
      );
    }
    
    // Filter by campaign type
    if (campaignType !== 'all') {
      filtered = filtered.filter(campaign => campaign.campaign_type === campaignType);
    }
    
    setFilteredCampaigns(filtered);
  }, [searchTerm, campaignType, campaigns]);
  
  const handleCreateCampaign = () => {
    if (!user) {
      navigate('/sign-in');
      return;
    }
    setShowCreateDialog(true);
  };
  
  const handleCampaignCreated = (campaign: FundingCampaign) => {
    setCampaigns(prev => [campaign, ...prev]);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Crowdfunding</h1>
          <p className="text-muted-foreground mt-1">
            Support group gifts and special occasions
          </p>
        </div>
        <Button onClick={handleCreateCampaign} className="flex items-center gap-1">
          <PlusCircle className="h-4 w-4 mr-1" />
          Create Campaign
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="md:col-span-2">
          <Input
            placeholder="Search campaigns"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <Select value={campaignType} onValueChange={setCampaignType}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="wedding">Wedding</SelectItem>
              <SelectItem value="graduation">Graduation</SelectItem>
              <SelectItem value="birthday">Birthday</SelectItem>
              <SelectItem value="product">Product</SelectItem>
              <SelectItem value="general">General</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 bg-muted rounded-md animate-pulse" />
          ))}
        </div>
      ) : filteredCampaigns.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.map((campaign) => (
            <CampaignCard 
              key={campaign.id} 
              campaign={campaign} 
              contributorsCount={contributorsCounts[campaign.id] || 0} 
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold mb-2">No campaigns found</h3>
          <p className="text-muted-foreground">
            {campaigns.length === 0
              ? "Be the first to start a funding campaign!"
              : "No campaigns match your search criteria."}
          </p>
          <Button 
            onClick={handleCreateCampaign} 
            variant="outline" 
            className="mt-4"
          >
            Create a Campaign
          </Button>
        </div>
      )}
      
      <CreateCampaignDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog} 
        onSuccess={handleCampaignCreated}
      />
    </div>
  );
};

export default Funding;
