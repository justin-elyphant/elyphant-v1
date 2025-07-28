import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingCart, 
  Star, 
  TrendingUp, 
  Gift, 
  ExternalLink,
  Heart,
  X
} from 'lucide-react';
import { ProductRecommendation, useEnhancedGiftRecommendations } from '@/hooks/useEnhancedGiftRecommendations';

interface EnhancedGiftRecommendationsProps {
  className?: string;
  onRecommendationSelect?: (recommendation: ProductRecommendation) => void;
  onPurchaseIntent?: (recommendation: ProductRecommendation) => void;
  showAnalytics?: boolean;
}

const EnhancedGiftRecommendations: React.FC<EnhancedGiftRecommendationsProps> = ({
  className = "",
  onRecommendationSelect,
  onPurchaseIntent,
  showAnalytics = true
}) => {
  const {
    recommendations,
    lastResponse,
    loading,
    error,
    selectRecommendation,
    dismissRecommendation,
    confidenceScore,
    recommendationSource
  } = useEnhancedGiftRecommendations();

  const handleRecommendationClick = async (recommendation: ProductRecommendation) => {
    await selectRecommendation(recommendation);
    onRecommendationSelect?.(recommendation);
  };

  const handlePurchaseClick = async (recommendation: ProductRecommendation) => {
    await selectRecommendation(recommendation);
    onPurchaseIntent?.(recommendation);
  };

  const handleDismiss = async (recommendation: ProductRecommendation) => {
    await dismissRecommendation(recommendation, 'user_dismissed');
  };

  if (loading) {
    return (
      <Card className={`w-full ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full"></div>
            <span className="text-muted-foreground">Generating personalized recommendations...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`w-full border-destructive ${className}`}>
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            <p className="font-medium">Failed to generate recommendations</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!recommendations.length) return null;

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-50';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getAvailabilityColor = (availability?: string) => {
    switch (availability) {
      case 'in_stock': return 'text-green-600 bg-green-50';
      case 'low_stock': return 'text-yellow-600 bg-yellow-50';
      case 'out_of_stock': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className={`w-full space-y-4 ${className}`}>
      {/* Header with Analytics */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Gift className="h-5 w-5 text-primary" />
              <span>Enhanced Gift Recommendations</span>
            </CardTitle>
            {showAnalytics && lastResponse && (
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className={getConfidenceColor(confidenceScore)}>
                  <Star className="h-3 w-3 mr-1" />
                  {Math.round(confidenceScore * 100)}% confidence
                </Badge>
                <Badge variant="secondary">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {lastResponse.metadata.searchStrategy}
                </Badge>
              </div>
            )}
          </div>
          {showAnalytics && lastResponse && (
            <div className="text-sm text-muted-foreground">
              Found {recommendations.length} personalized recommendations in {lastResponse.metadata.timeElapsed}ms
              {lastResponse.metadata.fallbackUsed && (
                <span className="text-yellow-600"> • Using fallback strategy</span>
              )}
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Recommendations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.map((recommendation) => (
          <Card 
            key={recommendation.productId} 
            className="group hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleRecommendationClick(recommendation)}
          >
            <CardContent className="p-4">
              {/* Header with dismiss button */}
              <div className="flex justify-between items-start mb-3">
                <Badge 
                  variant="outline" 
                  className={getConfidenceColor(recommendation.matchScore)}
                >
                  {Math.round(recommendation.matchScore * 100)}% match
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDismiss(recommendation);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>

              {/* Product Image Placeholder */}
              <div className="w-full h-32 bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                <Gift className="h-8 w-8 text-gray-400" />
              </div>

              {/* Product Info */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                  {recommendation.title}
                </h3>
                
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {recommendation.description}
                </p>

                <div className="flex items-center justify-between">
                  <span className="font-bold text-primary">
                    ${recommendation.price.toFixed(2)}
                  </span>
                  <Badge 
                    variant="outline" 
                    className={getAvailabilityColor(recommendation.availability)}
                  >
                    {recommendation.availability?.replace('_', ' ') || 'Available'}
                  </Badge>
                </div>

                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">From:</span> {recommendation.vendor}
                </div>

                {/* Match Reasons */}
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">Why this matches:</span>
                  <div className="flex flex-wrap gap-1">
                    {recommendation.matchReasons.slice(0, 2).map((reason, index) => (
                      <Badge key={index} variant="secondary" className="text-xs px-2 py-0.5">
                        {reason}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2 pt-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePurchaseClick(recommendation);
                    }}
                  >
                    <ShoppingCart className="h-3 w-3 mr-1" />
                    Buy Now
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Add to wishlist or save for later
                    }}
                  >
                    <Heart className="h-3 w-3" />
                  </Button>
                  {recommendation.purchaseUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(recommendation.purchaseUrl, '_blank');
                      }}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Footer Analytics */}
      {showAnalytics && lastResponse && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Powered by {recommendationSource === 'ai_analysis' ? 'AI Analysis' : 'Smart Catalog'}
              </span>
              <span>
                Recommendation ID: {lastResponse.analytics.recommendationId.slice(-8)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedGiftRecommendations;