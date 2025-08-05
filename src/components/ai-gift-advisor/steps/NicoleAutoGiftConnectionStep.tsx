import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, Calendar, Gift, Sparkles, ArrowRight, CheckCircle2, Users } from "lucide-react";
import { useGiftAdvisorBot } from "../hooks/useGiftAdvisorBot";
import { useConnections } from "@/hooks/profile/useConnections";
import { useUnifiedNicoleAI } from "@/hooks/useUnifiedNicoleAI";

type NicoleAutoGiftConnectionStepProps = ReturnType<typeof useGiftAdvisorBot>;

const NicoleAutoGiftConnectionStep = ({ 
  nextStep, 
  setBudget, 
  setOccasion, 
  botState,
  selectFriend 
}: NicoleAutoGiftConnectionStepProps) => {
  const { connections } = useConnections();
  const [selectedConnection, setSelectedConnection] = useState<any>(null);
  const [loadingSetup, setLoadingSetup] = useState(false);
  const { chatWithNicole } = useUnifiedNicoleAI({
    initialContext: { capability: 'auto_gifting' }
  });

  // Enhanced connections with upcoming events and relationship data
  const enhancedConnections = connections.map(conn => {
    const hasWishlist = Math.random() > 0.6; // Mock wishlist data
    const upcomingEvents = [
      { type: 'birthday', date: 'March 15th', daysAway: 28 },
      { type: 'anniversary', date: 'June 10th', daysAway: 115 }
    ].filter(() => Math.random() > 0.7);

    return {
      ...conn,
      hasWishlist,
      upcomingEvents,
      relationshipStrength: conn.relationship_type === 'friend' ? 'close_friend' : conn.relationship_type,
      pastGiftSuccess: Math.random() > 0.4
    };
  });

  const handleConnectionSelect = async (connection: any) => {
    setSelectedConnection(connection);
    setLoadingSetup(true);

    try {
      // Step 1: Nicole analyzes the connection and identifies occasions
      const analysisMessage = `I want to set up auto-gifting for ${connection.connected_user_id}. They're marked as my ${connection.relationshipStrength}. Can you analyze their upcoming events and recommend setup?`;
      
      const nicoleResponse = await chatWithNicole(analysisMessage);
      
      // Step 2: Auto-configure based on Nicole's analysis
      if (connection.upcomingEvents.length > 0) {
        const primaryEvent = connection.upcomingEvents[0];
        setOccasion(primaryEvent.type);
        
        // Step 3: Set relationship-adjusted budget
        const baseBudget = 75; // Default base budget
        const relationshipMultiplier = connection.relationshipStrength === 'close_friend' ? 1.1 : 
                                     connection.relationshipStrength === 'family' ? 1.2 : 1.0;
        const suggestedBudget = Math.round(baseBudget * relationshipMultiplier);
        
        setBudget({ min: Math.round(suggestedBudget * 0.7), max: suggestedBudget });
      }

      // Step 4: Set the friend and move to confirmation
      selectFriend(connection);
      
      setTimeout(() => {
        nextStep("auto-gift-confirmation");
      }, 1500);

    } catch (error) {
      console.error('Auto-gift setup error:', error);
      setLoadingSetup(false);
    }
  };

  if (loadingSetup) {
    return (
      <div className="space-y-6 text-center">
        <div className="space-y-3">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-white animate-pulse" />
          </div>
          <h2 className="text-xl font-semibold">Setting up auto-gifting...</h2>
          <p className="text-muted-foreground">
            Nicole is analyzing {selectedConnection?.connected_user_id}'s preferences and upcoming events
          </p>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 text-sm text-primary">
            <CheckCircle2 className="w-4 h-4" />
            <span>Analyzing relationship context</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-primary">
            <CheckCircle2 className="w-4 h-4" />
            <span>Detecting upcoming occasions</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>Setting up smart defaults</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold">Choose who to set up auto-gifting for</h2>
        <p className="text-muted-foreground">
          Nicole will analyze their preferences and upcoming events to create the perfect auto-gifting experience
        </p>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {enhancedConnections.map((connection) => (
          <Card 
            key={connection.id} 
            className="hover:shadow-md transition-all cursor-pointer border-2 hover:border-primary/20"
            onClick={() => handleConnectionSelect(connection)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-12 h-12">
                  <AvatarImage src="" />
                  <AvatarFallback>
                    {connection.connected_user_id.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium truncate">
                      {connection.connected_user_id}
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      {connection.relationshipStrength.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {connection.hasWishlist && (
                      <div className="flex items-center gap-1">
                        <Heart className="w-3 h-3 text-red-500" />
                        <span>Has wishlist</span>
                      </div>
                    )}
                    
                    {connection.upcomingEvents.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-blue-500" />
                        <span>{connection.upcomingEvents[0].type} in {connection.upcomingEvents[0].daysAway} days</span>
                      </div>
                    )}
                    
                    {connection.pastGiftSuccess && (
                      <div className="flex items-center gap-1">
                        <Gift className="w-3 h-3 text-green-500" />
                        <span>Gift history</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <ArrowRight className="w-5 h-5 text-muted-foreground" />
              </div>
              
              {connection.upcomingEvents.length > 1 && (
                <div className="mt-3 pt-3 border-t border-muted">
                  <p className="text-xs text-muted-foreground">
                    +{connection.upcomingEvents.length - 1} more upcoming event{connection.upcomingEvents.length > 2 ? 's' : ''}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {enhancedConnections.length === 0 && (
        <Card className="border-dashed border-2 border-muted">
          <CardContent className="p-8 text-center">
            <div className="space-y-3">
              <div className="w-12 h-12 mx-auto bg-muted rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="font-medium">No connections found</h3>
              <p className="text-sm text-muted-foreground">
                Add some friends first to set up auto-gifting for them
              </p>
              <Button variant="outline" size="sm">
                Add Friends
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NicoleAutoGiftConnectionStep;