
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Heart, ExternalLink, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Connection } from "@/types/connections";
import { navigateInIframe } from "@/utils/iframeUtils";

interface QuickGiftIdeasModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connection: Connection;
}

interface GiftIdea {
  id: string;
  name: string;
  description: string;
  priceRange: string;
  category: string;
  reasoning: string;
  imageUrl?: string;
}

const QuickGiftIdeasModal: React.FC<QuickGiftIdeasModalProps> = ({
  open,
  onOpenChange,
  connection
}) => {
  const navigate = useNavigate();
  const [giftIdeas, setGiftIdeas] = useState<GiftIdea[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      generateQuickIdeas();
    }
  }, [open, connection.id]);

  const generateQuickIdeas = async () => {
    setLoading(true);
    // Simulate AI generation - in real implementation, this would call an AI service
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mockIdeas: GiftIdea[] = [
      {
        id: "1",
        name: "Artisan Coffee Subscription",
        description: "Premium coffee beans delivered monthly",
        priceRange: "$25-50/month",
        category: "Food & Drink",
        reasoning: `Based on ${connection.name}'s interests in quality experiences`
      },
      {
        id: "2", 
        name: "Wireless Charging Station",
        description: "Sleek 3-in-1 charging dock for devices",
        priceRange: "$40-80",
        category: "Tech",
        reasoning: "Perfect for someone who values organization and efficiency"
      },
      {
        id: "3",
        name: "Cozy Reading Set",
        description: "Soft blanket with book light and bookmark",
        priceRange: "$30-60",
        category: "Lifestyle",
        reasoning: "Great for relaxing evenings and personal time"
      }
    ];
    
    setGiftIdeas(mockIdeas);
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-green-600" />
            Quick Gift Ideas for {connection.name}
          </DialogTitle>
          <DialogDescription>
            AI-powered suggestions based on your relationship and {connection.name}'s interests
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {loading ? (
            // Loading skeletons
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="border rounded-lg p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/2" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
            ))
          ) : (
            giftIdeas.map((idea) => (
              <div key={idea.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-lg">{idea.name}</h3>
                  <span className="text-sm font-medium text-green-600">{idea.priceRange}</span>
                </div>
                
                <p className="text-sm text-gray-600 mb-2">{idea.description}</p>
                
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="text-xs">{idea.category}</Badge>
                </div>
                
                <p className="text-xs text-muted-foreground mb-3 italic">
                  💡 {idea.reasoning}
                </p>
                
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Heart className="h-4 w-4 mr-1" />
                    Add to Wishlist
                  </Button>
                  <Button size="sm" className="flex-1">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Shop Now
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
        
        {!loading && giftIdeas.length > 0 && (
          <div className="border-t pt-4">
            <Button 
              className="w-full" 
              onClick={() => {
                // Navigate to marketplace with friend context using iframe-safe navigation
                const searchParams = new URLSearchParams();
                searchParams.set('friend', connection.id);
                searchParams.set('name', connection.name);
                navigateInIframe(`/marketplace?${searchParams.toString()}`, navigate);
              }}
            >
              <Search className="h-4 w-4 mr-2" />
              Browse More Gifts for {connection.name}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default QuickGiftIdeasModal;
