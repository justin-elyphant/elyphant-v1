import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gift, Heart, Clock, Eye } from "lucide-react";
import { Notification } from "@/contexts/notifications/NotificationsContext";

interface AutoGiftNotificationItemProps {
  notification: Notification;
  onQuickApprove?: () => void;
  onReview?: () => void;
  onRead: () => void;
}

const AutoGiftNotificationItem: React.FC<AutoGiftNotificationItemProps> = ({
  notification,
  onQuickApprove,
  onReview,
  onRead
}) => {
  const handleClick = () => {
    onRead();
    if (notification.link) {
      window.location.href = notification.link;
    }
  };

  const formatAmount = (amount?: number) => {
    return amount ? `$${amount.toFixed(2)}` : '';
  };

  return (
    <div className={`p-4 hover:bg-muted/50 transition-colors ${!notification.read ? 'bg-primary/5 border-l-4 border-primary' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {notification.type === 'auto_gift_approval' ? (
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <Heart className="h-4 w-4 text-yellow-600" />
            </div>
          ) : notification.type === 'auto_gift_approved' ? (
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <Gift className="h-4 w-4 text-green-600" />
            </div>
          ) : (
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <Clock className="h-4 w-4 text-red-600" />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm truncate">{notification.title}</h4>
            {!notification.read && (
              <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground mb-2">
            {notification.message}
          </p>
          
          {/* Enhanced info for auto-gift notifications */}
          {notification.type === 'auto_gift_approval' && (
            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
              {notification.recipientName && (
                <span>For {notification.recipientName}</span>
              )}
              {notification.eventType && (
                <span>• {notification.eventType}</span>
              )}
              {notification.totalAmount && (
                <span>• {formatAmount(notification.totalAmount)}</span>
              )}
              {notification.selectedProducts && (
                <span>• {notification.selectedProducts.length} items</span>
              )}
            </div>
          )}
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{new Date(notification.createdAt).toLocaleDateString()}</span>
            {notification.type === 'auto_gift_approval' && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                Action Required
              </Badge>
            )}
          </div>
        </div>
      </div>
      
      {/* Quick actions for auto-gift approval notifications */}
      {notification.type === 'auto_gift_approval' && (
        <div className="flex gap-2 mt-3 pl-11">
          <Button 
            size="sm" 
            onClick={(e) => {
              e.stopPropagation();
              onQuickApprove?.();
            }}
            className="flex-1"
          >
            <Gift className="h-3 w-3 mr-1" />
            Quick Approve
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={(e) => {
              e.stopPropagation();
              onReview?.();
            }}
          >
            <Eye className="h-3 w-3 mr-1" />
            Review
          </Button>
        </div>
      )}
      
      {/* Standard action button for other types */}
      {notification.type !== 'auto_gift_approval' && notification.actionText && (
        <Button 
          size="sm" 
          variant="outline" 
          onClick={handleClick}
          className="mt-3 ml-11"
        >
          {notification.actionText}
        </Button>
      )}
    </div>
  );
};

export default AutoGiftNotificationItem;