import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gift, MessageSquare, Settings, Calendar, Heart, Zap, List, Users, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useEnhancedConnections } from "@/hooks/profile/useEnhancedConnections";
import { useWishlists } from "@/components/gifting/hooks/useWishlists";
import LoadingFallback from "@/components/common/LoadingFallback";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import CoreNicoleExperience from "@/components/ai/nicole/CoreNicoleExperience";
import ProfileDataIntegrityPanel from "@/components/settings/ProfileDataIntegrityPanel";

interface ActionCard {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  variant: 'primary' | 'secondary' | 'accent';
  badge?: string;
}

const StreamlinedDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [realTimeStats, setRealTimeStats] = useState({
    autoGifts: 0,
    wishlistItems: 0,
    connections: 0,
    giftsSent: 0
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  
  // Enhanced hooks for real data
  const { connections, loading: connectionsLoading } = useEnhancedConnections();
  const { wishlists, isLoading: wishlistsLoading } = useWishlists();

  // Load real-time statistics
  useEffect(() => {
    const loadStats = async () => {
      if (!user) return;
      
      try {
        setIsLoadingStats(true);
        
        // Load auto-gift rules count
        const { count: autoGiftCount } = await supabase
          .from('auto_gifting_rules')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_active', true);
        
        // Count wishlist items
        const totalWishlistItems = wishlists.reduce((total, wl) => total + wl.items.length, 0);
        
        // Count accepted connections
        const acceptedConnections = connections.filter(c => c.status === 'accepted').length;
        
        // Load orders count (gifts sent) - check gift_options jsonb
        const { count: ordersCount } = await supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .not('gift_options', 'is', null);
        
        setRealTimeStats({
          autoGifts: autoGiftCount || 0,
          wishlistItems: totalWishlistItems,
          connections: acceptedConnections,
          giftsSent: ordersCount || 0
        });
      } catch (error) {
        console.error('Error loading dashboard stats:', error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    if (!connectionsLoading && !wishlistsLoading) {
      loadStats();
    }
  }, [user, connections, wishlists, connectionsLoading, wishlistsLoading]);

  // Core action cards based on user's primary use cases
  const actionCards: ActionCard[] = [
    {
      id: 'nicole-ai',
      title: 'Ask Nicole',
      description: 'Get personalized gift recommendations from our AI assistant',
      icon: MessageSquare,
      action: () => navigate('/marketplace?mode=nicole&open=true&greeting=dashboard'),
      variant: 'primary',
      badge: 'Core Feature'
    },
    {
      id: 'send-gift',
      title: 'Browse Marketplace',
      description: 'Explore gifts while seeing friends\' upcoming events',
      icon: Gift,
      action: () => navigate('/marketplace?enhanced=true'),
      variant: 'secondary',
      badge: 'Events Aware'
    },
    {
      id: 'my-wishlist',
      title: 'My Wishlists',
      description: 'Update your wishlist or create new ones for different occasions',
      icon: List,
      action: () => navigate('/my-wishlists'),
      variant: 'secondary'
    },
    {
      id: 'auto-gifts',
      title: 'Manage Auto-Gifts',
      description: 'Set up automated gifting for birthdays and special occasions',
      icon: Zap,
      action: () => navigate('/events?tab=monitoring'),
      variant: 'accent',
      badge: 'Smart'
    },
    {
      id: 'connections',
      title: 'My Connections',
      description: 'View friends, family, and their upcoming events',
      icon: Users,
      action: () => navigate('/connections'),
      variant: 'secondary'
    },
    {
      id: 'messages',
      title: 'Messages',
      description: 'Chat with friends about gifts and special occasions',
      icon: MessageSquare,
      action: () => navigate('/messages'),
      variant: 'secondary'
    },
    {
      id: 'events',
      title: 'Upcoming Events',
      description: 'Track birthdays, anniversaries, and special dates',
      icon: Calendar,
      action: () => navigate('/events'),
      variant: 'secondary'
    },
    {
      id: 'settings',
      title: 'Account Settings',
      description: 'Manage your profile, privacy, and preferences',
      icon: Settings,
      action: () => navigate('/settings'),
      variant: 'secondary'
    }
  ];

  const getCardStyles = (variant: string, isHovered: boolean) => {
    const baseStyles = "cursor-pointer transition-all duration-200 hover:shadow-lg";
    
    switch (variant) {
      case 'primary':
        return cn(
          baseStyles,
          "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0",
          isHovered && "scale-105 shadow-purple-200"
        );
      case 'accent':
        return cn(
          baseStyles,
          "bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0",
          isHovered && "scale-105 shadow-emerald-200"
        );
      default:
        return cn(
          baseStyles,
          "bg-white border border-gray-200 hover:border-gray-300",
          isHovered && "scale-105"
        );
    }
  };

  const getIconStyles = (variant: string) => {
    switch (variant) {
      case 'primary':
      case 'accent':
        return "h-6 w-6 text-white";
      default:
        return "h-6 w-6 text-purple-600";
    }
  };

  // Show loading fallback while initial data loads
  if (connectionsLoading || wishlistsLoading) {
    return <LoadingFallback type="dashboard" />;
  }

  return (
    <ErrorBoundary>
      <div className="space-y-8">
        {/* Profile Data Integrity Panel - Top Priority */}
        <ProfileDataIntegrityPanel />
        
        {/* Welcome Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back{user?.user_metadata?.first_name ? `, ${user.user_metadata.first_name}` : ''}! 👋
        </h1>
        <p className="text-lg text-muted-foreground">
          What would you like to do today?
        </p>
      </div>

      {/* Core Nicole Experience - Mainstreamed */}
      <CoreNicoleExperience 
        compact={false}
        showFeatures={true}
        triggerSource="dashboard"
        className="mb-6"
      />

      {/* Main Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {actionCards.map((card) => {
          const Icon = card.icon;
          const isHovered = hoveredCard === card.id;
          
          return (
            <Card
              key={card.id}
              className={getCardStyles(card.variant, isHovered)}
              onClick={card.action}
              onMouseEnter={() => setHoveredCard(card.id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <Icon className={getIconStyles(card.variant)} />
                  {card.badge && (
                    <Badge 
                      variant="secondary" 
                      className={cn(
                        "text-xs",
                        (card.variant === 'primary' || card.variant === 'accent') 
                          ? "bg-white/20 text-white border-white/20" 
                          : "bg-purple-100 text-purple-800"
                      )}
                    >
                      {card.badge}
                    </Badge>
                  )}
                </div>
                <CardTitle className={cn(
                  "text-xl",
                  (card.variant === 'primary' || card.variant === 'accent') ? "text-white" : "text-gray-900"
                )}>
                  {card.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className={cn(
                  (card.variant === 'primary' || card.variant === 'accent') 
                    ? "text-white/90" 
                    : "text-muted-foreground"
                )}>
                  {card.description}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Enhanced Quick Stats with Real Data */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {isLoadingStats ? "..." : realTimeStats.autoGifts}
            </div>
            <p className="text-sm text-muted-foreground">Active Auto-Gifts</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-emerald-600">
              {isLoadingStats ? "..." : realTimeStats.wishlistItems}
            </div>
            <p className="text-sm text-muted-foreground">Wishlist Items</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {isLoadingStats ? "..." : realTimeStats.connections}
            </div>
            <p className="text-sm text-muted-foreground">Connections</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-pink-600">
              {isLoadingStats ? "..." : realTimeStats.giftsSent}
            </div>
            <p className="text-sm text-muted-foreground">Gifts Sent</p>
          </CardContent>
        </Card>
      </div>


      </div>
    </ErrorBoundary>
  );
};

export default StreamlinedDashboard;