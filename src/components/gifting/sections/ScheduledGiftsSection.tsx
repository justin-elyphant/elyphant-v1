import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Package, Truck, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { useScheduledGifts } from '@/hooks/useScheduledGifts';

interface ScheduledGiftsSectionProps {
  onTrackOrder?: (orderId: string) => void;
  onCancelGift?: (giftId: string) => void;
  onScheduleNew?: () => void;
}

const ScheduledGiftsSection: React.FC<ScheduledGiftsSectionProps> = ({
  onTrackOrder,
  onCancelGift,
  onScheduleNew
}) => {
  const { gifts, loading, error } = useScheduledGifts();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <Clock className="h-4 w-4" />;
      case 'processing': return <Package className="h-4 w-4" />;
      case 'shipped': return <Truck className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'failed': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'processing': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'shipped': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
      case 'delivered': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'failed': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const canCancel = (gift: any) => {
    return gift.status === 'scheduled' || gift.status === 'processing';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" />
            Scheduled Gifts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div>
                    <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-1" />
                    <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" />
            Scheduled Gifts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              Scheduled Gifts
            </CardTitle>
            <CardDescription>
              Track delivery status and manage scheduled gifts
            </CardDescription>
          </div>
          <Button 
            size="sm" 
            variant="outline"
            onClick={onScheduleNew}
            className="flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            Schedule Gift
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {gifts.length > 0 ? (
          <div className="space-y-3">
            {gifts.map((gift) => (
              <div key={gift.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-3">
                  {gift.productImage ? (
                    <img 
                      src={gift.productImage} 
                      alt={gift.productName}
                      className="w-12 h-12 object-cover rounded border"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded border flex items-center justify-center ${gift.productImage ? 'hidden' : ''}`}>
                    <Package className="h-6 w-6 text-gray-400" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium line-clamp-1">{gift.productName}</h4>
                      {gift.isAutoGift && (
                        <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                          Auto-Gift
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>To: {gift.recipientName}</span>
                      <span>•</span>
                      <span>Scheduled: {format(new Date(gift.scheduledDate), 'MMM d, yyyy')}</span>
                      {gift.totalAmount && (
                        <>
                          <span>•</span>
                          <span>${gift.totalAmount}</span>
                        </>
                      )}
                    </div>
                    {gift.orderNumber && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Order #{gift.orderNumber}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${getStatusColor(gift.status)}`}
                  >
                    {getStatusIcon(gift.status)}
                    <span className="ml-1 capitalize">{gift.status}</span>
                  </Badge>
                  
                  <div className="flex gap-1">
                    {(gift.status === 'shipped' || gift.status === 'delivered') && gift.trackingNumber && (
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => onTrackOrder?.(gift.orderId)}
                      >
                        Track
                      </Button>
                    )}
                    {canCancel(gift) && (
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => onCancelGift?.(gift.id)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No scheduled gifts</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Schedule gifts for future delivery or set up auto-gifting
            </p>
            <Button variant="outline" onClick={onScheduleNew}>
              Schedule a Gift
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ScheduledGiftsSection;