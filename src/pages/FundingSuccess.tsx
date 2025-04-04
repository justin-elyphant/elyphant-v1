
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const FundingSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [campaignTitle, setCampaignTitle] = useState<string | null>(null);
  
  // Get the session ID from URL params
  const sessionId = searchParams.get('session_id');
  
  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) {
        navigate('/funding');
        return;
      }
      
      try {
        // In a real app, we would verify the payment with Stripe
        // For this demo, we'll assume the payment was successful and find the contribution
        
        const { data, error } = await supabase
          .from('contributions')
          .select('campaign_id, payment_intent_id, amount')
          .eq('payment_intent_id', sessionId)
          .single();
          
        if (error || !data) {
          console.error('Error verifying payment:', error);
          navigate('/funding');
          return;
        }
        
        setCampaignId(data.campaign_id);
        
        // Update contribution status to succeeded
        await supabase
          .from('contributions')
          .update({ payment_status: 'succeeded' })
          .eq('payment_intent_id', sessionId);
          
        // Update campaign amount
        const { data: campaignData } = await supabase
          .from('funding_campaigns')
          .select('current_amount, title')
          .eq('id', data.campaign_id)
          .single();
          
        if (campaignData) {
          setCampaignTitle(campaignData.title);
          
          await supabase
            .from('funding_campaigns')
            .update({ 
              current_amount: campaignData.current_amount + data.amount,
              updated_at: new Date().toISOString()
            })
            .eq('id', data.campaign_id);
        }
        
      } catch (err) {
        console.error('Error processing success page:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    verifyPayment();
  }, [sessionId, navigate]);
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-16 px-4 flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Processing your contribution...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-16 px-4 flex justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 bg-green-100 p-3 rounded-full inline-flex">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Thank You!</CardTitle>
          <CardDescription className="text-lg">
            Your contribution was successful
          </CardDescription>
        </CardHeader>
        
        <CardContent className="text-center">
          {campaignTitle && (
            <p className="text-muted-foreground mb-4">
              You've successfully contributed to <span className="font-medium">{campaignTitle}</span>
            </p>
          )}
          <p>Thank you for your generosity! Your contribution will help make this campaign a success.</p>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-2">
          {campaignId && (
            <Button 
              onClick={() => navigate(`/funding/${campaignId}`)}
              className="w-full"
            >
              Return to Campaign
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={() => navigate('/funding')}
            className="w-full"
          >
            View All Campaigns
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default FundingSuccess;
