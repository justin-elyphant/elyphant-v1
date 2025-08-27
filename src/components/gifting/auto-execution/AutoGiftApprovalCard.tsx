import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Gift, Heart, Clock, DollarSign, Eye } from "lucide-react";
import { format } from "date-fns";

interface AutoGiftApprovalCardProps {
  executionId: string;
  recipientName: string;
  recipientImage?: string;
  eventType: string;
  executionDate: string;
  selectedProducts: any[];
  totalAmount: number;
  onQuickApprove: () => void;
  onReview: () => void;
  onReject?: () => void;
  className?: string;
}

const AutoGiftApprovalCard: React.FC<AutoGiftApprovalCardProps> = ({
  executionId,
  recipientName,
  recipientImage,
  eventType,
  executionDate,
  selectedProducts,
  totalAmount,
  onQuickApprove,
  onReview,
  onReject,
  className = ""
}) => {
  const primaryProduct = selectedProducts[0];
  const additionalProductsCount = selectedProducts.length - 1;
  
  const getEventIcon = (eventType: string) => {
    switch (eventType.toLowerCase()) {
      case 'birthday':
        return "🎂";
      case 'anniversary':
        return "💝";
      case 'holiday':
        return "🎄";
      case 'graduation':
        return "🎓";
      default:
        return "🎉";
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <Card className={`border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5 hover:shadow-lg transition-shadow ${className}`}>
      <CardContent className="p-6">
        {/* Header with recipient info */}
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-12 w-12 border-2 border-primary/20">
            <AvatarImage src={recipientImage} alt={recipientName} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {getInitials(recipientName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{getEventIcon(eventType)}</span>
              <h3 className="font-semibold text-lg">{recipientName}'s {eventType}</h3>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {format(new Date(executionDate), 'MMM d, yyyy')}
            </div>
          </div>
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Heart className="h-3 w-3 mr-1" />
            Needs Approval
          </Badge>
        </div>

        {/* Selected gift preview */}
        <div className="bg-white rounded-lg p-4 mb-4 border border-border/50">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center border">
                {(primaryProduct?.image || primaryProduct?.image_url) ? (
                  <img 
                    src={primaryProduct.image || primaryProduct.image_url} 
                    alt={primaryProduct.title || primaryProduct.product_name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <Gift className="h-8 w-8 text-gray-400" />
                )}
              </div>
              {additionalProductsCount > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-primary text-primary-foreground">
                  +{additionalProductsCount}
                </Badge>
              )}
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-sm mb-1">
                {primaryProduct?.title || primaryProduct?.product_name || 'Selected Gift'}
              </h4>
              <p className="text-sm text-muted-foreground mb-2">
                {additionalProductsCount > 0 
                  ? `${selectedProducts.length} items selected` 
                  : primaryProduct?.category || 'Perfect match based on interests'
                }
              </p>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="font-semibold text-green-600">
                  ${totalAmount.toFixed(2)}
                </span>
                <span className="text-sm text-muted-foreground">
                  · Free shipping
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* AI confidence indicator */}
        <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          High confidence match based on {recipientName}'s interests and past gifts
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <Button 
            onClick={onQuickApprove}
            className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-medium py-3"
          >
            <Gift className="h-4 w-4 mr-2" />
            Approve & Send
          </Button>
          
          <Button 
            variant="outline" 
            onClick={onReview}
            className="flex items-center gap-2 px-6 border-2 hover:bg-secondary/50"
          >
            <Eye className="h-4 w-4" />
            Review
          </Button>
          
          {onReject && (
            <Button 
              variant="ghost" 
              onClick={onReject}
              className="px-4 text-muted-foreground hover:text-destructive"
            >
              Skip
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AutoGiftApprovalCard;