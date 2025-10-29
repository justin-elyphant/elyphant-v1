import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Calendar, Gift, ShoppingCart, ExternalLink, Heart } from "lucide-react";
import { Wishlist, WishlistItem } from "@/types/profile";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useCart } from "@/contexts/CartContext";
import AutoGiftSetupFlow from "@/components/gifting/auto-gift/AutoGiftSetupFlow";
import { format, addYears, isWithinInterval } from "date-fns";

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
    addToCart({
      id: item.product_id,
      name: item.title || item.name || 'Product',
      price: item.price || 0,
      image: item.image_url || undefined
    } as any);

    toast.success("Added to cart", {
      description: `${item.title || item.name} from ${profileOwner.name}'s wishlist`
    });
  };

  const handleViewProduct = (productId: string) => {
    navigate(`/product/${productId}`);
  };

  const handleSetupAutoGift = (type: 'auto' | 'scheduled') => {
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
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="flex-shrink-0"
          >
            <X className="h-5 w-5" />
          </Button>
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
              <Button
                variant="default"
                size="sm"
                onClick={() => handleSetupAutoGift('auto')}
              >
                Send {profileOwner.name.split(' ')[0]} a Gift
              </Button>
            </div>
          </div>
        )}

        {/* Upcoming Event Banner */}
        {upcomingEvent && (
          <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border border-purple-200 dark:border-purple-800 rounded-lg">
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSetupAutoGift('scheduled')}
                  className="whitespace-nowrap"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule a Gift
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleSetupAutoGift('auto')}
                  className="whitespace-nowrap"
                >
                  <Gift className="h-4 w-4 mr-2" />
                  Set Up Auto-Gift
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Wishlist Items Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {wishlist.items?.map((item) => (
            <Card key={item.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
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
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 rounded-full shadow-lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCart(item);
                    }}
                  >
                    <ShoppingCart className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="p-3 space-y-2">
                <h3 className="font-medium text-sm line-clamp-2 min-h-[2.5rem]">
                  {item.title || item.name || 'Product'}
                </h3>
                {item.price && (
                  <p className="text-lg font-bold text-primary">
                    ${item.price.toFixed(2)}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleViewProduct(item.product_id)}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleAddToCart(item)}
                  >
                    <ShoppingCart className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
            </Card>
          ))}
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

      {/* Auto-Gift Setup Dialog */}
      <AutoGiftSetupFlow
        open={showAutoGiftSetup}
        onOpenChange={setShowAutoGiftSetup}
        initialData={autoGiftInitialData}
      />
    </>
  );
};

export default InlineWishlistViewer;
