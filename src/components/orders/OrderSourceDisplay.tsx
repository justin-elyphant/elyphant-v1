import React, { useState } from 'react';
import { OrderSourceAnalysis } from '@/types/orderSource';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ShoppingCart, 
  Calendar, 
  Zap, 
  Bot, 
  ChevronDown, 
  ChevronUp,
  Clock,
  CheckCircle,
  Mail
} from 'lucide-react';
import { formatScheduledDate, formatScheduledDateTime } from '@/utils/date-formatting';
import { format } from 'date-fns';

interface OrderSourceDisplayProps {
  analysis: OrderSourceAnalysis;
}

const OrderSourceDisplay = ({ analysis }: OrderSourceDisplayProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getSourceIcon = () => {
    switch (analysis.sourceType) {
      case 'standard':
        return <ShoppingCart className="h-4 w-4" />;
      case 'scheduled':
        return <Calendar className="h-4 w-4" />;
      case 'auto_gift':
        return <Zap className="h-4 w-4" />;
      case 'ai_auto_gift':
        return <Bot className="h-4 w-4" />;
      default:
        return <ShoppingCart className="h-4 w-4" />;
    }
  };

  const getSourceLabel = () => {
    switch (analysis.sourceType) {
      case 'standard':
        return 'Standard Order';
      case 'scheduled':
        return 'Scheduled Gift';
      case 'auto_gift':
        return 'Auto-Gift';
      case 'ai_auto_gift':
        return 'AI Auto-Gift';
      default:
        return 'Standard Order';
    }
  };

  const getBadgeVariant = () => {
    switch (analysis.sourceType) {
      case 'standard':
        return 'secondary';
      case 'scheduled':
        return 'outline';
      case 'auto_gift':
        return 'default';
      case 'ai_auto_gift':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getBadgeClassName = () => {
    switch (analysis.sourceType) {
      case 'scheduled':
        return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300';
      case 'auto_gift':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300';
      case 'ai_auto_gift':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300';
      default:
        return '';
    }
  };

  const hasExpandableContent = analysis.sourceType !== 'standard' && (
    analysis.recipientInfo || 
    analysis.selectedProducts?.length || 
    analysis.giftMessage ||
    analysis.scheduledDate
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge 
            variant={getBadgeVariant()} 
            className={`${getBadgeClassName()} flex items-center gap-1.5 px-2.5 py-1`}
          >
            {getSourceIcon()}
            {getSourceLabel()}
          </Badge>
          
          {analysis.aiAttribution && (
            <span className="text-xs text-muted-foreground">
              {analysis.aiAttribution.confidence}% confidence
            </span>
          )}
        </div>

        {hasExpandableContent && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 p-2 active:scale-[0.98] transition-transform"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        )}
      </div>

      {/* Basic info for non-standard orders */}
      {!isExpanded && analysis.sourceType !== 'standard' && (
        <div className="text-sm text-muted-foreground">
          {analysis.sourceType === 'scheduled' && analysis.scheduledDate && (
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              Delivery: {formatScheduledDate(analysis.scheduledDate)}
              {analysis.giftMessage && <span className="ml-2 text-xs">• Gift</span>}
            </div>
          )}
          
          {(analysis.sourceType === 'auto_gift' || analysis.sourceType === 'ai_auto_gift') && analysis.recipientInfo && (
            <div className="flex items-center gap-1.5">
              <span>To: {analysis.recipientInfo.name}</span>
              {analysis.approvalInfo?.status === 'manually_approved' && (
                <CheckCircle className="h-3 w-3 text-green-600" />
              )}
            </div>
          )}
        </div>
      )}

      {/* Expanded details */}
      {isExpanded && hasExpandableContent && (
        <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border/50">
          {/* Scheduled delivery details */}
          {analysis.sourceType === 'scheduled' && analysis.scheduledDate && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4" />
                Delivery Schedule
              </div>
              <p className="text-sm text-muted-foreground">
                Scheduled for {formatScheduledDateTime(analysis.scheduledDate, 'EEEE, MMMM d, yyyy')}
              </p>
            </div>
          )}

          {/* Recipient information */}
          {analysis.recipientInfo && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Recipient</div>
              <p className="text-sm text-muted-foreground">{analysis.recipientInfo.name}</p>
            </div>
          )}

          {/* AI Attribution details */}
          {analysis.aiAttribution && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Bot className="h-4 w-4 text-blue-600" />
                Nicole AI Analysis
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>Confidence Score: {analysis.aiAttribution.confidence}%</p>
                {analysis.aiAttribution.discoveryMethod && (
                  <p>Discovery: {analysis.aiAttribution.discoveryMethod}</p>
                )}
              </div>
            </div>
          )}

          {/* Approval information */}
          {analysis.approvalInfo && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                {analysis.approvalInfo.status === 'manually_approved' ? (
                  <Mail className="h-4 w-4 text-blue-600" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
                Approval Status
              </div>
              <div className="text-sm text-muted-foreground">
                {analysis.approvalInfo.status === 'manually_approved' ? (
                  <div>
                    <p>Manually approved via {analysis.approvalInfo.approvedVia || 'email'}</p>
                    {analysis.approvalInfo.approvedAt && (
                      <p>Approved on {format(new Date(analysis.approvalInfo.approvedAt), 'MMM d, yyyy')}</p>
                    )}
                  </div>
                ) : (
                  <p>Automatically approved based on your preferences</p>
                )}
              </div>
            </div>
          )}

          {/* Selected products */}
          {analysis.selectedProducts && analysis.selectedProducts.length > 0 && (
            <div className="space-y-3">
              <div className="text-sm font-medium">Selected Products</div>
              <div className="space-y-2">
                {analysis.selectedProducts.map((product, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 bg-background rounded-md border border-border/30">
                    {product.image ? (
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-10 h-10 rounded object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-muted rounded flex items-center justify-center flex-shrink-0">
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{product.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>${product.price.toFixed(2)}</span>
                        {product.confidence && (
                          <span>{product.confidence}% match</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gift message */}
          {analysis.giftMessage && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Gift Message</div>
              <p className="text-sm text-muted-foreground italic p-3 bg-background rounded border border-border/30">
                "{analysis.giftMessage}"
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderSourceDisplay;