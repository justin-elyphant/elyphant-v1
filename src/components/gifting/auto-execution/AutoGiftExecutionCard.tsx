import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  DollarSign, 
  Eye, 
  ChevronDown, 
  ChevronRight,
  Package,
  MapPin,
  Calendar,
  Info
} from "lucide-react";
import { format } from "date-fns";
import { normalizeProductForDisplay } from "@/utils/productDataTransforms";
import { migrateExecutionProductData } from "@/utils/executionDataMigration";

interface AutoGiftExecutionCardProps {
  execution: any;
  onReviewProducts?: (execution: any) => void;
}

const AutoGiftExecutionCard: React.FC<AutoGiftExecutionCardProps> = ({ 
  execution, 
  onReviewProducts 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Auto-migrate product data if needed
  useEffect(() => {
    const migrateIfNeeded = async () => {
      if (execution.selected_products && 
          Array.isArray(execution.selected_products) &&
          typeof execution.selected_products[0] === 'string' &&
          !isUpdating) {
        setIsUpdating(true);
        await migrateExecutionProductData(execution.id);
        setIsUpdating(false);
        // Note: The parent component should handle reloading the data
      }
    };
    
    migrateIfNeeded();
  }, [execution.id, execution.selected_products, isUpdating]);
  
  // Normalize products for display
  const normalizedProducts = useMemo(() => {
    if (!execution.selected_products) return [];
    
    // If selected_products is array of strings (IDs), show loading state
    if (typeof execution.selected_products[0] === 'string') {
      return execution.selected_products.map((productId: string) => ({
        id: productId,
        product_id: productId,
        title: isUpdating ? 'Updating product details...' : 'Loading product details...',
        name: isUpdating ? 'Updating product details...' : 'Loading product details...',
        price: 0,
        image: '',
        productSource: 'manual'
      }));
    }
    
    // If already objects, normalize them
    return execution.selected_products.map((product: any) => normalizeProductForDisplay(product));
  }, [execution.selected_products, isUpdating]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'processing':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'pending_approval':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'order_placed':
        return <Package className="h-4 w-4 text-blue-500" />;
      case 'order_failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'yellow';
      case 'processing':
        return 'blue';
      case 'pending_approval':
        return 'orange';
      case 'approved':
        return 'green';
      case 'order_placed':
        return 'blue';
      case 'order_failed':
        return 'red';
      case 'completed':
        return 'green';
      case 'failed':
        return 'red';
      case 'cancelled':
        return 'gray';
      default:
        return 'gray';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <Card className="transition-shadow hover:shadow-md">
      <div className={isExpanded ? "border-primary/20" : ""}>
        <div 
          className="flex items-center justify-between p-4 border-b cursor-pointer hover:bg-muted/50"
          onClick={() => setIsExpanded(!isExpanded)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsExpanded(!isExpanded);
            }
          }}
        >
          <div className="flex items-center gap-4">
            {getStatusIcon(execution.status)}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium">Auto-gift execution</p>
                <Badge 
                  variant="outline" 
                  className={`text-${getStatusColor(execution.status)}-700 bg-${getStatusColor(execution.status)}-50`}
                >
                  {execution.status.charAt(0).toUpperCase() + execution.status.slice(1)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Execution date: {format(execution.execution_date, 'MMM d, yyyy')}
              </p>
              {normalizedProducts.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {normalizedProducts.length} products • {formatCurrency(execution.total_amount || 0)}
                </p>
              )}
              {execution.error_message && (
                <p className="text-sm text-red-600 mt-1">
                  Error: {execution.error_message}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {execution.total_amount && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <DollarSign className="h-3 w-3" />
                {execution.total_amount.toFixed(2)}
              </div>
            )}
            
            {/* Status-specific action buttons */}
            {(execution.status === 'pending_approval' || execution.status === 'pending') && execution.selected_products && onReviewProducts && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={(e) => {
                  e.stopPropagation();
                  onReviewProducts(execution);
                }}
              >
                Review
              </Button>
            )}
            
            {/* TEMPORARY: Send Gift button for approved executions to test ZMA routing */}
            {execution.status === 'approved' && execution.selected_products && onReviewProducts && (
              <Button 
                size="sm" 
                variant="default" 
                onClick={(e) => {
                  e.stopPropagation();
                  onReviewProducts(execution);
                }}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Send Gift
              </Button>
            )}
            
            {/* Retry button for processing executions that might be stuck or failed */}
            {(execution.status === 'processing' || execution.status === 'order_failed') && execution.selected_products && onReviewProducts && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={(e) => {
                  e.stopPropagation();
                  onReviewProducts(execution);
                }}
              >
                Retry
              </Button>
            )}
            
            {execution.status === 'order_placed' && (
              <Badge variant="outline" className="text-blue-700 bg-blue-50">
                Order Processing
              </Badge>
            )}
            
            {execution.status === 'order_failed' && (
              <Badge variant="outline" className="text-red-700 bg-red-50">
                Order Failed
              </Badge>
            )}
            
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>

        {isExpanded && (
          <CardContent className="pt-4">
            <div className="space-y-4">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Created</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(execution.created_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
                
                {execution.updated_at && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Last Updated</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(execution.updated_at), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Rule Information */}
              {execution.rule_id && (
                <div className="border rounded-lg p-3 bg-muted/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">Rule Details</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Rule ID: {execution.rule_id}
                  </p>
                  {execution.event_id && (
                    <p className="text-sm text-muted-foreground">
                      Event ID: {execution.event_id}
                    </p>
                  )}
                </div>
              )}

              {/* Address Information */}
              {execution.address_metadata && (
                <div className="border rounded-lg p-3 bg-muted/30">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">Address Status</p>
                  </div>
                  <div className="space-y-1">
                    {execution.address_metadata.source && (
                      <p className="text-sm text-muted-foreground">
                        Source: <span className="capitalize">{execution.address_metadata.source.replace('_', ' ')}</span>
                      </p>
                    )}
                    {execution.address_metadata.needs_confirmation && (
                      <p className="text-sm text-orange-600">
                        ⚠️ Needs address confirmation
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Selected Products */}
              {normalizedProducts.length > 0 && (
                <div className="border rounded-lg p-3 bg-muted/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">Selected Products ({normalizedProducts.length})</p>
                  </div>
                  <div className="space-y-2">
                    {normalizedProducts.slice(0, 3).map((product: any, index: number) => (
                      <div key={index} className="flex items-center gap-3 p-2 bg-background rounded border">
                        {product.image && (
                          <img 
                            src={product.image} 
                            alt={product.title}
                            className="w-10 h-10 object-cover rounded"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {product.title || 'Gift Item'}
                          </p>
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-green-600 font-medium">
                              {formatCurrency(product.price || 0)}
                            </p>
                            {product.marketplace && (
                              <Badge variant="outline" className="text-xs">
                                {product.marketplace}
                              </Badge>
                            )}
                            {product.productSource && (
                              <Badge variant="secondary" className="text-xs">
                                {product.productSource}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {normalizedProducts.length > 3 && (
                      <p className="text-sm text-muted-foreground text-center">
                        +{normalizedProducts.length - 3} more products
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* AI Agent Source */}
              {execution.ai_agent_source && (
                <div className="border rounded-lg p-3 bg-muted/30">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">AI Analysis</p>
                  </div>
                  <div className="space-y-1">
                    {execution.ai_agent_source.agent && (
                      <p className="text-sm text-muted-foreground">
                        Agent: <span className="capitalize">{execution.ai_agent_source.agent}</span>
                      </p>
                    )}
                    {execution.ai_agent_source.confidence_score !== undefined && (
                      <p className="text-sm text-muted-foreground">
                        Confidence: {Math.round(execution.ai_agent_source.confidence_score * 100)}%
                      </p>
                    )}
                    {execution.ai_agent_source.discovery_method && (
                      <p className="text-sm text-muted-foreground">
                        Method: <span className="capitalize">{execution.ai_agent_source.discovery_method.replace('_', ' ')}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Retry Information */}
              {execution.retry_count > 0 && (
                <div className="border rounded-lg p-3 bg-yellow-50 border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    🔄 Retry attempt: {execution.retry_count}
                    {execution.next_retry_at && (
                      <span className="block mt-1">
                        Next retry: {format(new Date(execution.next_retry_at), 'MMM d, yyyy h:mm a')}
                      </span>
                    )}
                  </p>
                </div>
              )}

              {/* Order Information */}
              {execution.order_id && (
                <div className="border rounded-lg p-3 bg-green-50 border-green-200">
                  <p className="text-sm text-green-800">
                    📦 Order placed: {execution.order_id}
                  </p>
                </div>
              )}

              {/* Status-specific information */}
              {execution.status === 'order_placed' && (
                <div className="border rounded-lg p-3 bg-blue-50 border-blue-200">
                  <p className="text-sm text-blue-800">
                    🚚 Order is being processed and will be shipped soon
                  </p>
                </div>
              )}

              {execution.status === 'order_failed' && (
                <div className="border rounded-lg p-3 bg-red-50 border-red-200">
                  <p className="text-sm text-red-800">
                    ❌ Order placement failed - use Retry button to re-approve and try again
                  </p>
                  {execution.error_message && (
                    <p className="text-xs text-red-600 mt-1">
                      Error: {execution.error_message}
                    </p>
                  )}
                </div>
              )}

              {execution.status === 'processing' && (
                <div className="border rounded-lg p-3 bg-yellow-50 border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    🔄 Processing - if stuck for more than 10 minutes, use Retry button
                  </p>
                </div>
              )}

              {execution.status === 'rejected' && (
                <div className="border rounded-lg p-3 bg-gray-50 border-gray-200">
                  <p className="text-sm text-gray-800">
                    🚫 Gift selection was rejected
                  </p>
                  {execution.error_message && (
                    <p className="text-xs text-gray-600 mt-1">
                      Reason: {execution.error_message}
                    </p>
                  )}
                </div>
              )}

              {execution.status === 'cancelled' && (
                <div className="border rounded-lg p-3 bg-gray-50 border-gray-200">
                  <p className="text-sm text-gray-800">
                    ⏹️ Execution was cancelled (likely due to duplicate)
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </div>
    </Card>
  );
};

export default AutoGiftExecutionCard;