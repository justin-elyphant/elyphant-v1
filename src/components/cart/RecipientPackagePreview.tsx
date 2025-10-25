import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Package, MessageCircle, AlertTriangle, CheckCircle2, Calendar as CalendarIcon, Clock, Mail, AlertCircle } from 'lucide-react';
import { CartItem } from '@/contexts/CartContext';
import { DeliveryGroup } from '@/types/recipient';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface RecipientPackagePreviewProps {
  deliveryGroup: DeliveryGroup;
  cartItems: CartItem[];
  onPackageSchedulingUpdate?: (groupId: string, scheduledDate: string | null) => void;
}

const RecipientPackagePreview: React.FC<RecipientPackagePreviewProps> = ({
  deliveryGroup,
  cartItems,
  onPackageSchedulingUpdate
}) => {
  const [deliveryTiming, setDeliveryTiming] = useState<'now' | 'scheduled'>(
    deliveryGroup.scheduledDeliveryDate ? 'scheduled' : 'now'
  );
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    deliveryGroup.scheduledDeliveryDate ? new Date(deliveryGroup.scheduledDeliveryDate) : undefined
  );
  const groupItems = cartItems.filter(
    item => item.recipientAssignment?.deliveryGroupId === deliveryGroup.id
  );

  // Analyze gift messages
  const messagesMap = new Map<string, CartItem[]>();
  groupItems.forEach(item => {
    const message = item.recipientAssignment?.giftMessage || '';
    if (!messagesMap.has(message)) {
      messagesMap.set(message, []);
    }
    messagesMap.get(message)!.push(item);
  });

  const uniqueMessages = Array.from(messagesMap.keys()).filter(msg => msg.trim());
  const itemsWithoutMessages = messagesMap.get('') || [];
  const hasMultipleMessages = uniqueMessages.length > 1;
  const hasInconsistentMessages = uniqueMessages.length > 0 && itemsWithoutMessages.length > 0;

  const getMessageStatus = () => {
    if (uniqueMessages.length === 0) {
      return {
        type: 'none' as const,
        icon: MessageCircle,
        color: 'text-muted-foreground',
        bgColor: 'bg-muted/20',
        title: 'No gift messages',
        description: 'None of the items have gift messages'
      };
    }
    
    if (uniqueMessages.length === 1 && itemsWithoutMessages.length === 0) {
      return {
        type: 'consistent' as const,
        icon: CheckCircle2,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        title: 'Consistent messaging',
        description: 'All items share the same gift message'
      };
    }
    
    return {
      type: 'inconsistent' as const,
      icon: AlertTriangle,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      title: 'Mixed messaging',
      description: 'Items have different or missing gift messages'
    };
  };

  const messageStatus = getMessageStatus();
  const isPending = deliveryGroup.connectionStatus === 'pending_invitation';

  const handleDeliveryTimingChange = (value: 'now' | 'scheduled') => {
    setDeliveryTiming(value);
    if (value === 'now') {
      setSelectedDate(undefined);
      onPackageSchedulingUpdate?.(deliveryGroup.id, null);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date && onPackageSchedulingUpdate) {
      onPackageSchedulingUpdate(deliveryGroup.id, date.toISOString().split('T')[0]);
    }
  };

  return (
    <Card className={cn("border-l-4", isPending ? "border-l-amber-500" : "border-l-blue-500")}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {isPending ? (
            <Mail className="h-5 w-5 text-amber-600" />
          ) : (
            <Package className="h-5 w-5 text-blue-600" />
          )}
          Package for {deliveryGroup.connectionName}
          <Badge variant="secondary" className="ml-auto">
            {groupItems.length} items
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Pending Invitation Alert */}
        {isPending && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800">Invitation Pending</p>
                <p className="text-sm text-amber-700 mt-1">
                  <strong>{deliveryGroup.connectionName}</strong> hasn't signed up yet. They'll receive reminders at 3, 7, and 14 days.
                </p>
                {deliveryGroup.address_last_updated && (
                  <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Invited {formatDistanceToNow(new Date(deliveryGroup.address_last_updated), { addSuffix: true })}
                  </p>
                )}
                <p className="text-xs text-amber-700 mt-2">
                  📦 Your gift will be held securely until they provide their shipping address during signup.
                </p>
              </div>
            </div>
          </div>
        )}
        {/* Package Contents */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Contents:</h4>
          <div className="space-y-1">
            {groupItems.map(item => (
              <div key={item.product.product_id} className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span>{item.product.name}</span>
                <span className="text-muted-foreground">×{item.quantity}</span>
                {item.recipientAssignment?.giftMessage && (
                  <MessageCircle className="h-3 w-3 text-green-600 ml-auto" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Message Status */}
        <div className={`p-3 rounded-lg ${messageStatus.bgColor}`}>
          <div className="flex items-start gap-2">
            <messageStatus.icon className={`h-4 w-4 ${messageStatus.color} mt-0.5 flex-shrink-0`} />
            <div className="flex-1">
              <p className={`text-sm font-medium ${messageStatus.color}`}>
                {messageStatus.title}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {messageStatus.description}
              </p>
            </div>
          </div>
        </div>

        {/* Message Details */}
        {uniqueMessages.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Gift Messages:</h4>
            {uniqueMessages.map((message, index) => {
              const itemsWithMessage = messagesMap.get(message) || [];
              return (
                <div key={index} className="bg-white border rounded p-2">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageCircle className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-muted-foreground">
                      {itemsWithMessage.length} item{itemsWithMessage.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <p className="text-sm">{message}</p>
                </div>
              );
            })}
            
            {itemsWithoutMessages.length > 0 && (
              <div className="bg-muted/20 border rounded p-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 border border-muted-foreground rounded" />
                  <span className="text-xs text-muted-foreground">
                    {itemsWithoutMessages.length} item{itemsWithoutMessages.length === 1 ? '' : 's'} without message
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">No gift message</p>
              </div>
            )}
          </div>
        )}

        {/* Delivery Timing Section */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Delivery Timing:</h4>
          <RadioGroup
            value={deliveryTiming}
            onValueChange={handleDeliveryTimingChange}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="now" id={`${deliveryGroup.id}-now`} />
              <Label htmlFor={`${deliveryGroup.id}-now`} className="cursor-pointer">
                Send now (arrives in 2-3 business days)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="scheduled" id={`${deliveryGroup.id}-scheduled`} />
              <Label htmlFor={`${deliveryGroup.id}-scheduled`} className="cursor-pointer">
                Schedule for specific date
              </Label>
            </div>
          </RadioGroup>

          {deliveryTiming === 'scheduled' && (
            <div className="mt-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : <span>Pick delivery date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              {selectedDate && (
                <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-800">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    Will be processed 4 days before delivery date to ensure on-time arrival
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recommendations */}
        {hasMultipleMessages && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Recommendation:</p>
                <p>
                  Consider using one consistent message for all items, since {deliveryGroup.connectionName} 
                  will receive them in a single package.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecipientPackagePreview;