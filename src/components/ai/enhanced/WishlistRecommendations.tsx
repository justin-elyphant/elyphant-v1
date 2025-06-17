
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, ShoppingCart, Star, DollarSign } from "lucide-react";
import { WishlistRecommendation } from "@/services/ai/enhancedNicoleService";

interface WishlistRecommendationsProps {
  recommendations: WishlistRecommendation[];
  onSelectItem: (recommendation: WishlistRecommendation) => void;
  userBudget?: [number, number];
}

const WishlistRecommendations: React.FC<WishlistRecommendationsProps> = ({
  recommendations,
  onSelectItem,
  userBudget
}) => {
  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority?: string) => {
    switch (priority) {
      case 'high': return <Star className="h-3 w-3 fill-current" />;
      case 'medium': return <Heart className="h-3 w-3" />;
      case 'low': return <ShoppingCart className="h-3 w-3" />;
      default: return <ShoppingCart className="h-3 w-3" />;
    }
  };

  if (recommendations.length === 0) {
    return (
      <div className="text-center p-4 text-gray-600">
        <Heart className="h-8 w-8 mx-auto mb-2 text-gray-400" />
        <p>No wishlist items found in your criteria.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <Heart className="h-4 w-4 text-purple-600" />
        <span className="text-sm font-medium text-gray-700">From Their Wishlist</span>
        {userBudget && (
          <Badge variant="outline" className="text-xs">
            Budget: ${userBudget[0]} - ${userBudget[1]}
          </Badge>
        )}
      </div>

      {recommendations.slice(0, 5).map((recommendation, index) => (
        <Card 
          key={`${recommendation.item.id}-${index}`} 
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onSelectItem(recommendation)}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {/* Item Image */}
              <div className="w-16 h-16 flex-shrink-0">
                <img
                  src={recommendation.item.image_url || recommendation.item.image || '/placeholder.svg'}
                  alt={recommendation.item.title || recommendation.item.name || 'Product'}
                  className="w-full h-full object-cover rounded-md"
                />
              </div>

              {/* Item Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900 truncate pr-2">
                    {recommendation.item.title || recommendation.item.name || 'Wishlist Item'}
                  </h4>
                  <Badge 
                    className={`${getPriorityColor(recommendation.priority)} flex items-center gap-1 text-xs flex-shrink-0`}
                  >
                    {getPriorityIcon(recommendation.priority)}
                    {recommendation.priority || 'medium'}
                  </Badge>
                </div>

                {recommendation.item.brand && (
                  <p className="text-sm text-gray-600 mb-1">{recommendation.item.brand}</p>
                )}

                <div className="flex items-center gap-2 mb-2">
                  {recommendation.item.price && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-gray-500" />
                      <span className={`text-sm font-medium ${
                        recommendation.inBudget ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        ${recommendation.item.price}
                      </span>
                    </div>
                  )}
                  {recommendation.inBudget && (
                    <Badge variant="secondary" className="text-xs bg-green-50 text-green-700">
                      In Budget
                    </Badge>
                  )}
                </div>

                <p className="text-xs text-gray-600 mb-3">
                  {recommendation.reasoning}
                </p>

                <Button 
                  size="sm" 
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectItem(recommendation);
                  }}
                >
                  Select This Gift
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {recommendations.length > 5 && (
        <div className="text-center pt-2">
          <p className="text-xs text-gray-500">
            Showing top 5 of {recommendations.length} wishlist matches
          </p>
        </div>
      )}
    </div>
  );
};

export default WishlistRecommendations;
