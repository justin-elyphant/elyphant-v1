import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Package, MapPin } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface ChildOrder {
  id: string;
  order_number: string;
  status: string;
  zinc_status?: string;
  total_amount: number;
  split_order_index: number;
  delivery_group_id?: string;
  cart_data?: any;
}

interface SplitOrderDisplayProps {
  parentOrder: any;
  childOrders: ChildOrder[];
}

const SplitOrderDisplay: React.FC<SplitOrderDisplayProps> = ({ parentOrder, childOrders }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardContent className="p-4">
        {/* Parent Order Summary */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 text-blue-600" />
            <div>
              <div className="font-semibold">{parentOrder.order_number}</div>
              <div className="text-sm text-muted-foreground">
                {childOrders.length} recipient{childOrders.length === 1 ? '' : 's'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="font-semibold">{formatPrice(parentOrder.total_amount)}</div>
              <Badge variant="secondary" className="mt-1">
                Multi-Recipient
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Expanded Child Orders */}
        {isExpanded && (
          <div className="mt-4 space-y-3 border-t pt-4">
            {childOrders.map((child) => (
              <div key={child.id} className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">
                      Package {child.split_order_index} of {childOrders.length}
                    </span>
                    <Badge variant={
                      child.status === 'completed' ? 'default' :
                      child.status === 'failed' ? 'destructive' :
                      'outline'
                    } className="text-xs">
                      {child.zinc_status || child.status}
                    </Badge>
                  </div>
                  
                  {child.delivery_group_id && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>Group: {child.delivery_group_id.slice(0, 8)}...</span>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground mt-1">
                    Order #{child.order_number}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-medium">{formatPrice(child.total_amount)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SplitOrderDisplay;
