import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gift, Heart, MessageCircle, Package, Sparkles } from 'lucide-react';
import { toast } from "sonner";
import { useAuth } from '@/contexts/auth';

const GiftPreview = () => {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [giftData, setGiftData] = useState<any>(null);
  const [showGift, setShowGift] = useState(false);
  const action = searchParams.get('action');

  useEffect(() => {
    if (action === 'thankyou') {
      handleThankYouAction();
    } else {
      loadGiftData();
    }
  }, [token, action]);

  const loadGiftData = async () => {
    try {
      const { data: tokenData, error: tokenError } = await supabase
        .from('gift_preview_tokens')
        .select(`
          *,
          orders (
            id,
            order_number,
            created_at,
            occasion,
            gift_message,
            scheduled_delivery_date,
            order_items (
              product_name,
              product_image,
              quantity,
              price
            ),
            profiles!orders_user_id_fkey (
              id,
              first_name,
              full_name
            )
          )
        `)
        .eq('token', token)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (tokenError || !tokenData) {
        toast.error('Invalid or expired gift link');
        navigate('/');
        return;
      }

      if (!tokenData.viewed_at) {
        await supabase
          .from('gift_preview_tokens')
          .update({ viewed_at: new Date().toISOString() })
          .eq('id', tokenData.id);

        // Note: gift_preview_viewed tracking removed from orders table
        // Tracking is done via gift_preview_tokens.viewed_at instead
      }

      setGiftData(tokenData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading gift:', error);
      toast.error('Failed to load gift preview');
      navigate('/');
    }
  };

  const handleThankYouAction = async () => {
    const { data: tokenData } = await supabase
      .from('gift_preview_tokens')
      .select('orders(id, profiles!orders_user_id_fkey(id, first_name))')
      .eq('token', token)
      .single();

    if (tokenData?.orders) {
      const orderProfiles = Array.isArray(tokenData.orders.profiles) 
        ? tokenData.orders.profiles[0] 
        : tokenData.orders.profiles;
      const giftorId = orderProfiles?.id;
      const giftorName = orderProfiles?.first_name;
      
      navigate(`/messages/${giftorId}?context=gift_thankyou&giftor=${giftorName}`);
    }
  };

  const handlePreviewGift = () => {
    setShowGift(true);
  };

  const handleSendThankYou = async () => {
    const order = giftData?.orders;
    const giftorId = order?.profiles?.id;
    const giftorName = order?.profiles?.first_name || order?.profiles?.full_name;

    navigate(`/messages/${giftorId}?context=gift_thankyou&giftor=${giftorName}&order=${order?.order_number}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Gift className="h-12 w-12 animate-bounce mx-auto mb-4 text-primary" />
          <p className="text-lg text-foreground">Loading your surprise...</p>
        </div>
      </div>
    );
  }

  const order = giftData?.orders;
  const giftor = Array.isArray(order?.profiles) ? order?.profiles[0] : order?.profiles;
  const giftItem = order?.order_items?.[0];

  if (!showGift) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
              <Gift className="h-10 w-10 text-primary-foreground" />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              You've Got a Gift!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <p className="text-xl text-foreground">
                <strong className="text-primary">{giftor?.first_name || 'Someone special'}</strong> sent you something for your <strong>{order?.occasion || 'special day'}</strong>! 🎉
              </p>

              {order?.gift_message && (
                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border-l-4 border-primary p-4 rounded-r-lg">
                  <p className="text-sm text-muted-foreground mb-1">Personal message:</p>
                  <p className="italic text-foreground">"{order.gift_message}"</p>
                </div>
              )}

              <div className="py-8 space-y-4">
                <p className="text-lg font-semibold text-foreground">What would you like to do?</p>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <Button 
                    onClick={handlePreviewGift}
                    size="lg"
                    className="h-auto py-6 bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                  >
                    <div className="text-center">
                      <Sparkles className="h-6 w-6 mx-auto mb-2" />
                      <div className="font-bold">Preview Gift</div>
                      <div className="text-xs opacity-90">See what's inside</div>
                    </div>
                  </Button>

                  <Button 
                    onClick={handleSendThankYou}
                    size="lg"
                    variant="outline"
                    className="h-auto py-6 border-2"
                  >
                    <div className="text-center">
                      <Heart className="h-6 w-6 mx-auto mb-2" />
                      <div className="font-bold">Keep Surprise</div>
                      <div className="text-xs">Say thanks now</div>
                    </div>
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground pt-4">
                  Either way, you can send {giftor?.first_name} a thank you message! ✨
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <Card className="shadow-2xl">
          <CardHeader className="text-center">
            <Badge className="mx-auto mb-4 bg-gradient-to-r from-primary to-secondary">
              🎁 Your Gift Revealed
            </Badge>
            <CardTitle className="text-2xl">
              From {giftor?.first_name || 'Someone Special'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <img 
                  src={giftItem?.product_image} 
                  alt={giftItem?.product_name}
                  className="w-full h-64 object-cover rounded-lg shadow-md"
                />
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold">{giftItem?.product_name}</h3>
                  <p className="text-muted-foreground">For your {order?.occasion}</p>
                </div>

                {order?.scheduled_delivery_date && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Package className="h-4 w-4" />
                    <span>Expected: {new Date(order.scheduled_delivery_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</span>
                  </div>
                )}

                <div className="pt-4">
                  <Button 
                    onClick={handleSendThankYou}
                    size="lg"
                    className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                  >
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Send Thank You Message
                  </Button>
                </div>

                <Button 
                  variant="outline"
                  onClick={() => navigate(`/orders/${order?.order_number}`)}
                  className="w-full"
                >
                  <Package className="mr-2 h-4 w-4" />
                  Track Delivery
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GiftPreview;
