import React, { useState, useEffect } from "react";
import { formatPrice } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Calendar, Gift, ShoppingCart, ExternalLink, Heart, CheckCircle2 } from "lucide-react";
import { Wishlist, WishlistItem } from "@/types/profile";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useCart } from "@/contexts/CartContext";
import { useWishlistPurchasedItems } from "@/hooks/useWishlistPurchasedItems";
import UnifiedGiftSchedulingModal from "@/components/gifting/unified/UnifiedGiftSchedulingModal";
import { format, addYears, isWithinInterval } from "date-fns";
import { motion } from "framer-motion";
import { triggerHapticFeedback, HapticPatterns } from "@/utils/haptics";

interface InlineWishlistViewerProps {
  wishlist: Wishlist;
  profileOwner: {
    id: string;
    name: string;
  };
  isConnected: boolean;
  connectionData?: {
    relationship?: string;
    customRelationship?: string;
    connectionDate?: string;
    isAutoGiftEnabled?: boolean;
  };
  onClose: () => void;
}

interface UpcomingEvent {
  id: string;
  event_name: string;
  event_date: string;
  date_type: string;
  days_until: number;
}

const InlineWishlistViewer: React.FC<InlineWishlistViewerProps> = ({
  wishlist,
  profileOwner,
  isConnected,
  connectionData,
  onClose
}) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { purchasedItemIds } = useWishlistPurchasedItems(wishlist.id);
  const [upcomingEvent, setUpcomingEvent] = useState<UpcomingEvent | null>(null);
  const [lastGiftDate, setLastGiftDate] = useState<string | null>(null);
  const [showAutoGiftSetup, setShowAutoGiftSetup] = useState(false);
  const [autoGiftInitialData, setAutoGiftInitialData] = useState<any>(null);

  // Fetch upcoming events from profile's important_dates
  useEffect(() => {
    const fetchUpcomingEvents = async () => {
      try {
        const today = new Date();
        const sixtyDaysFromNow = new Date();
        sixtyDaysFromNow.setDate(today.getDate() + 60);

        const { data: profile, error } = await (supabase as any)
          .from('profiles')
          .select('important_dates')
          .eq('id', profileOwner.id)
          .single();

        if (error) throw error;

        if (profile && profile.important_dates) {
          const dates = Array.isArray(profile.important_dates) 
            ? profile.important_dates 
            : [];
          
          // Find the next upcoming date within 60 days
          const upcomingDate = dates
            .map((date: any) => {
              const dateStr = date.date;
              // Parse MM-DD format and add current year
              const [month, day] = dateStr.split('-').map(Number);
              const eventDate = new Date(new Date().getFullYear(), month - 1, day);
              
              // If date has passed this year, use next year
              if (eventDate < today) {
                eventDate.setFullYear(eventDate.getFullYear() + 1);
              }
              
              return {
                ...date,
                parsedDate: eventDate
              };
            })
            .filter((date: any) => {
              return date.parsedDate >= today && date.parsedDate <= sixtyDaysFromNow;
            })
            .sort((a: any, b: any) => a.parsedDate.getTime() - b.parsedDate.getTime())[0];

          if (upcomingDate) {
            const daysUntil = Math.ceil((upcomingDate.parsedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            
            setUpcomingEvent({
              id: upcomingDate.id || crypto.randomUUID(),
              event_name: upcomingDate.title || upcomingDate.description || 'Special Day',
              event_date: upcomingDate.parsedDate.toISOString(),
              date_type: upcomingDate.type || 'other',
              days_until: daysUntil
            });
          }
        }
      } catch (error) {
        console.error('Error fetching upcoming events:', error);
      }
    };

    fetchUpcomingEvents();
  }, [profileOwner.id]);

  // Fetch last gift date if connected
  useEffect(() => {
    const fetchLastGiftDate = async () => {
      if (!isConnected) return;

      try {
        const result = await (supabase as any).from('orders').select('created_at').eq('buyer_id', profileOwner.id).order('created_at', { ascending: false }).limit(1).maybeSingle();

        if (result.error) throw result.error;
        if (result.data) {
          setLastGiftDate(result.data.created_at);
        }
      } catch (error) {
        console.error('Error fetching last gift date:', error);
      }
    };

    fetchLastGiftDate();
  }, [isConnected, profileOwner.id]);

  const handleAddToCart = (item: WishlistItem) => {
    triggerHapticFeedback(HapticPatterns.buttonTap);
    addToCart({
      id: item.product_id,
      name: item.title || item.name || 'Product',
      price: item.price || 0,
      image: item.image_url || undefined
    } as any);

    triggerHapticFeedback('success');
    toast.success("Added to cart", {
      description: `${item.title || item.name} from ${profileOwner.name}'s wishlist`
    });
  };

  const handleViewProduct = (productId: string) => {
    triggerHapticFeedback(HapticPatterns.buttonTap);
    navigate(`/product/${productId}`);
  };

  const handleSetupAutoGift = (type: 'auto' | 'scheduled') => {
    triggerHapticFeedback(HapticPatterns.buttonTap);
    const initialData = {
      recipientId: profileOwner.id,
      recipientName: profileOwner.name,
      eventType: upcomingEvent?.date_type || 'other',
      eventDate: upcomingEvent?.event_date,
      budgetLimit: 50
    };

    setAutoGiftInitialData(initialData);
    setShowAutoGiftSetup(true);
  };

  const getEventEmoji = (dateType: string) => {
    const emojiMap: Record<string, string> = {
      'birthday': '🎂',
      'anniversary': '💝',
      'christmas': '🎄',
      'mothers_day': '🌸',
      'fathers_day': '👔',
      'valentine': '❤️',
      'valentines_day': '❤️',
      'graduation': '🎓',
      'wedding': '💒',
      'other': '🎁'
    };
    return emojiMap[dateType] || '🎁';
  };

  const formatLastGiftDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const monthsAgo = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 30));
    
    if (monthsAgo === 0) return 'This month';
    if (monthsAgo === 1) return '1 month ago';
    return `${monthsAgo} months ago`;
  };

  return (
    <>
      <Card className="p-6 animate-in slide-in-from-top-4 duration-300">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold">{wishlist.title}</h2>
              {wishlist.is_public && (
                <Badge variant="secondary">Public</Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              {wishlist.items?.length || 0} items • {profileOwner.name}'s wishlist
            </p>
          </div>
          <motion.div whileTap={{ scale: 0.9 }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                triggerHapticFeedback('light');
                onClose();
              }}
              className="flex-shrink-0 min-h-[44px] min-w-[44px]"
            >
              <X className="h-5 w-5" />
            </Button>
          </motion.div>
        </div>

        {/* Connection Context Banner */}
        {isConnected && (
          <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 flex-1">
                <span className="text-2xl">🤝</span>
                <div>
                  <p className="font-semibold">
                    Your {connectionData?.relationship || connectionData?.customRelationship || 'Connection'}
                  </p>
                  {lastGiftDate && (
                    <p className="text-sm text-muted-foreground">
                      Last gift: {formatLastGiftDate(lastGiftDate)}
                    </p>
                  )}
                </div>
              </div>
              <motion.div whileTap={{ scale: 0.97 }}>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleSetupAutoGift('auto')}
                  className="min-h-[44px]"
                >
                  Send {profileOwner.name.split(' ')[0]} a Gift
                </Button>
              </motion.div>
            </div>
          </div>
        )}

        {/* Upcoming Event Banner */}
        {upcomingEvent && (
          <div className="mb-6 p-4 bg-muted border border-border rounded-lg">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <span className="text-3xl">{getEventEmoji(upcomingEvent.date_type)}</span>
                <div>
                  <p className="font-semibold text-lg">
                    {profileOwner.name.split(' ')[0]}'s {upcomingEvent.event_name} in {upcomingEvent.days_until} days
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {format(new Date(upcomingEvent.event_date), 'MMMM d, yyyy')}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <motion.div whileTap={{ scale: 0.97 }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSetupAutoGift('scheduled')}
                    className="whitespace-nowrap min-h-[44px]"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule a Gift
                  </Button>
                </motion.div>
                <motion.div whileTap={{ scale: 0.97 }}>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleSetupAutoGift('auto')}
                    className="whitespace-nowrap min-h-[44px]"
                  >
                    <Gift className="h-4 w-4 mr-2" />
                    Set Up Auto-Gift
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>
        )}

        {/* Wishlist Items Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {wishlist.items?.map((item) => {
            const isPurchased = purchasedItemIds.has(item.id);
            
            return (
              <Card 
                key={item.id} 
                className={`overflow-hidden group hover:shadow-lg transition-shadow ${isPurchased ? 'opacity-60' : ''}`}
              >
                <div className="relative aspect-square">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.title || item.name || 'Product'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Gift className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  
                  {/* Purchased Badge */}
                  {isPurchased && (
                    <div className="absolute top-2 left-2 z-10">
                      <Badge className="text-xs bg-green-500 text-white border-green-600">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Purchased
                      </Badge>
                    </div>
                  )}
                  
                  {/* Add to cart overlay - only show if not purchased */}
                  {!isPurchased && (
                    <div className="absolute top-2 right-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <motion.div whileTap={{ scale: 0.9 }}>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-11 w-11 min-h-[44px] min-w-[44px] rounded-full shadow-lg"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(item);
                          }}
                        >
                          <ShoppingCart className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    </div>
                  )}
                </div>
                <div className="p-3 space-y-2">
                  <h3 className="font-medium text-sm line-clamp-2 min-h-[2.5rem]">
                    {item.title || item.name || 'Product'}
                  </h3>
                  {item.price && (
                    <p className="text-lg font-bold text-primary">
                      {formatPrice(item.price)}
                    </p>
                  )}
                  {isPurchased ? (
                    <div className="flex items-center justify-center py-2 text-sm text-green-600 font-medium">
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Someone bought this!
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <motion.div whileTap={{ scale: 0.97 }} className="flex-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full min-h-[44px]"
                          onClick={() => handleViewProduct(item.product_id)}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </motion.div>
                      <motion.div whileTap={{ scale: 0.97 }} className="flex-1">
                        <Button
                          variant="default"
                          size="sm"
                          className="w-full min-h-[44px]"
                          onClick={() => handleAddToCart(item)}
                        >
                          <ShoppingCart className="h-3 w-3 mr-1" />
                          Add
                        </Button>
                      </motion.div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {(!wishlist.items || wishlist.items.length === 0) && (
          <div className="text-center py-12">
            <Gift className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No items yet</h3>
            <p className="text-muted-foreground">
              {profileOwner.name} hasn't added any items to this wishlist
            </p>
          </div>
        )}
      </Card>

      {/* Recurring Gift Setup Dialog */}
      <UnifiedGiftSchedulingModal
        open={showAutoGiftSetup}
        onOpenChange={setShowAutoGiftSetup}
        standaloneMode={true}
        editingRule={autoGiftInitialData}
      />
    </>
  );
};

export default InlineWishlistViewer;
