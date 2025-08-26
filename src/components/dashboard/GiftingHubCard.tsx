import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Gift, Calendar, Heart, Package, Zap, Search, Plus, Eye, Clock, Bot, Users, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GiftPathSelector } from "@/components/gifting/unified/GiftPathSelector";
import { MyGiftsDashboard } from "@/components/gifting/unified/MyGiftsDashboard";
import AutoGiftSetupFlow from "@/components/gifting/auto-gift/AutoGiftSetupFlow";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

// Import existing hooks and components
import { useAuth } from "@/contexts/auth";
import { useUnifiedWishlistSystem } from "@/hooks/useUnifiedWishlistSystem";
import { EventsProvider, useEvents } from "@/components/gifting/events/context/EventsContext";
import { useEnhancedConnections } from "@/hooks/profile/useEnhancedConnections";
import { getUserOrders, Order } from "@/services/orderService";

import ProductDetailsDialog from "@/components/marketplace/ProductDetailsDialog";
import { supabase } from "@/integrations/supabase/client";

// Import group components
import ActiveGroupProjectsWidget from "./ActiveGroupProjectsWidget";
import GroupGiftAnalytics from "./GroupGiftAnalytics";

// Smart Gifting Tab Component
const SmartGiftingTab = () => {
  const { events, isLoading: eventsLoading } = useEvents();
  const { pendingInvitations, loading: connectionsLoading } = useEnhancedConnections();
  const { user } = useAuth();
  const [autoGiftSetupOpen, setAutoGiftSetupOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedEventForSetup, setSelectedEventForSetup] = useState<any>(null);

  const upcomingEvents = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const eventsWithDays = events
      .filter(event => {
        if (!event.dateObj) return false;
        return event.dateObj >= today;
      })
      .map(event => {
        const daysAway = Math.ceil((event.dateObj!.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return {
          ...event,
          daysAway,
          urgency: daysAway <= 7 ? 'high' : daysAway <= 30 ? 'medium' : 'low'
        };
      })
      .sort((a, b) => {
        if (!a.dateObj || !b.dateObj) return 0;
        return a.dateObj.getTime() - b.dateObj.getTime();
      });
    
    return eventsWithDays.slice(0, 4);
  }, [events]);

  const handleSetupAutoGift = async (event: any) => {
    setSelectedEvent(event);
    setSelectedEventForSetup(event);
    setAutoGiftSetupOpen(true);
  };

  const handlePathSelection = (path: 'ai-autopilot' | 'manual-control') => {
    if (path === 'ai-autopilot') {
      setAutoGiftSetupOpen(true);
    } else {
      window.location.href = '/marketplace';
    }
  };

  if (eventsLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-4 border rounded-lg animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2" />
              <div className="h-3 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Gift Path Selector */}
      <div>
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">How would you like to give gifts?</h3>
          <p className="text-sm text-muted-foreground">
            Choose your preferred approach to gift-giving
          </p>
        </div>
        <GiftPathSelector onSelectPath={handlePathSelection} />
      </div>

      {/* Auto-Gift Hub Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Zap className="h-5 w-5 mr-2 text-emerald-500" />
            Upcoming Events
          </h3>
        </div>
        
        {upcomingEvents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="p-4 border rounded-lg bg-white dark:bg-gray-800 touch-manipulation">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      {event.type.toLowerCase().includes("birthday") ? (
                        <Gift className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      ) : (
                        <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold">{event.person}</h4>
                      <p className="text-sm text-muted-foreground">{event.type}</p>
                    </div>
                  </div>
                  
                  {event.daysAway <= 7 && (
                    <Badge variant="outline" className="text-orange-600">
                      <Clock className="h-3 w-3 mr-1" />
                      {event.daysAway === 0 ? 'Today' : 
                        event.daysAway === 1 ? 'Tomorrow' : 
                        `${event.daysAway} days`}
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {event.dateObj ? format(event.dateObj, 'MMM d, yyyy') : event.date}
                  </p>
                  <div className="flex items-center gap-2">
                    {event.autoGiftEnabled ? (
                      <Badge variant="secondary" className="text-xs">
                        Auto-Gift Enabled
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        Reminders Only
                      </Badge>
                    )}
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleSetupAutoGift(event)}
                      className="h-8 sm:h-7 touch-manipulation"
                    >
                      {event.autoGiftEnabled ? 'Edit' : 'Set Up AI'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 border rounded-lg bg-gray-50 dark:bg-gray-800">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h4 className="font-medium mb-2">No upcoming events</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Add special occasions to set up automated gifting
            </p>
            <Button onClick={() => setAutoGiftSetupOpen(true)}>
              <Zap className="h-4 w-4 mr-2" />
              Set Up Auto-Gifting
            </Button>
          </div>
        )}
      </div>

      {/* Nicole AI Quick Access */}
      <div className="p-4 sm:p-6 border rounded-lg bg-gradient-to-r from-purple-100 via-blue-100 to-cyan-100 dark:from-purple-900/30 dark:via-blue-900/30 dark:to-cyan-900/30 shadow-lg relative overflow-hidden">
        {/* Subtle animated background effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-blue-500/5 to-cyan-500/5 animate-pulse"></div>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div className="flex-1">
            <h4 className="font-semibold flex items-center">
              <Bot className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
              <span className="bg-gradient-to-r from-purple-700 to-cyan-700 bg-clip-text text-transparent">
                Need Gift Ideas?
              </span>
            </h4>
            <p className="text-sm text-muted-foreground mt-1">Ask Nicole for personalized AI recommendations</p>
          </div>
          <Button asChild className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white border-0 shadow-md h-10 sm:h-9 w-full sm:w-auto">
            <Link to="/marketplace?mode=nicole&open=true&greeting=dashboard">
              Ask Nicole
            </Link>
          </Button>
        </div>
      </div>

      {/* Auto-Gift Setup Flow */}
      <AutoGiftSetupFlow
        open={autoGiftSetupOpen}
        onOpenChange={setAutoGiftSetupOpen}
        eventId={selectedEventForSetup?.id}
        eventType={selectedEventForSetup?.type}
        recipientId={selectedEventForSetup?.connectionId}
      />
    </div>
  );
};

// My Collections Tab Component
const MyCollectionsTab = () => {
  const { wishlists, loading } = useUnifiedWishlistSystem();
  const { user } = useAuth();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductDetails, setShowProductDetails] = useState(false);

  const { totalItems, wishlistCount, allItems } = React.useMemo(() => {
    const totalItems = wishlists?.reduce((total, wishlist) => total + (wishlist.items?.length || 0), 0) || 0;
    const wishlistCount = wishlists?.length || 0;

    const allItems = wishlists?.flatMap(wishlist => 
      (wishlist.items || []).map(item => ({
        ...item,
        wishlistName: wishlist.title,
        addedDate: item.created_at ? new Date(item.created_at) : new Date()
      }))
    ) || [];
      
    return { totalItems, wishlistCount, allItems };
  }, [wishlists]);

  const handleProductClick = (item: any) => {
    const productData = {
      id: item.product_id || item.id,
      product_id: item.product_id || item.id,
      title: item.name || item.title,
      name: item.name || item.title,
      price: item.price,
      image: item.image_url,
      image_url: item.image_url,
      brand: item.brand,
      description: item.description,
      features: item.features || [],
      specifications: item.specifications || {},
      category: item.category,
      tags: item.tags || [],
      rating: item.rating,
      review_count: item.review_count,
      availability: item.availability || 'in_stock'
    };
    
    setSelectedProduct(productData);
    setShowProductDetails(true);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-4 border rounded-lg animate-pulse">
              <div className="w-full h-32 bg-gray-200 rounded mb-3" />
              <div className="h-4 bg-gray-200 rounded mb-2" />
              <div className="h-3 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-primary">{wishlistCount}</p>
                <p className="text-sm text-muted-foreground">Total Wishlists</p>
              </div>
              <Heart className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-primary">{totalItems}</p>
                <p className="text-sm text-muted-foreground">Total Items</p>
              </div>
              <Gift className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-primary">
                  ${allItems.reduce((total, item) => total + (item.price || 0), 0).toFixed(0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Value</p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Items */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Recent Items</h3>
          <Button variant="outline" size="sm" asChild>
            <Link to="/wishlists">
              <Eye className="h-4 w-4 mr-2" />
              View All Lists
            </Link>
          </Button>
        </div>
        
        {allItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {allItems.slice(0, 6).map((item) => (
              <Card 
                key={item.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleProductClick(item)}
              >
                <CardContent className="p-4">
                  <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
                    {item.image_url ? (
                      <img 
                        src={item.image_url} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <h4 className="font-medium line-clamp-2 mb-1">{item.name}</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    From: {item.wishlistName}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-primary">
                      {formatPrice(item.price || 0)}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {format(item.addedDate, 'MMM d')}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border rounded-lg bg-gray-50 dark:bg-gray-800">
            <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h4 className="font-medium mb-2">No wishlist items yet</h4>
            <p className="text-sm text-muted-foreground mb-6">
              Start adding items to your wishlists to see them here
            </p>
            <Button asChild>
              <Link to="/marketplace">
                <Search className="h-4 w-4 mr-2" />
                Browse Products
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Product Details Dialog */}
      {selectedProduct && (
        <ProductDetailsDialog
          product={selectedProduct}
          open={showProductDetails}
          onOpenChange={setShowProductDetails}
          userData={user}
        />
      )}
    </div>
  );
};

// My Gifts Tab Component (Unified Dashboard)
const MyGiftsTab = () => {
  const [autoGiftSetupOpen, setAutoGiftSetupOpen] = useState(false);

  const handleEditRule = (ruleId: string) => {
    console.log('Edit rule:', ruleId);
    setAutoGiftSetupOpen(true);
  };

  const handleScheduleGift = () => {
    window.location.href = '/marketplace';
  };

  return (
    <div className="space-y-6">
      <MyGiftsDashboard 
        onEditRule={handleEditRule}
        onScheduleGift={handleScheduleGift}
      />
      
      <AutoGiftSetupFlow
        open={autoGiftSetupOpen}
        onOpenChange={setAutoGiftSetupOpen}
      />
    </div>
  );
};

// Group Projects Tab Component
const GroupProjectsTab = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActiveGroupProjectsWidget />
        <GroupGiftAnalytics />
      </div>
    </div>
  );
};

// Main Gifting Hub Card Component
const GiftingHubCard = () => {
  const [activeTab, setActiveTab] = useState("smart-gifting");

  return (
    <EventsProvider>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-6 w-6 text-purple-600" />
            Gifting Hub
          </CardTitle>
          <CardDescription>
            Your comprehensive gift management center
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="smart-gifting">Smart Gifting</TabsTrigger>
              <TabsTrigger value="my-gifts">My Gifts</TabsTrigger>
              <TabsTrigger value="my-collections">Collections</TabsTrigger>
              <TabsTrigger value="group-projects">Group Projects</TabsTrigger>
            </TabsList>
            
            <TabsContent value="smart-gifting" className="mt-6">
              <SmartGiftingTab />
            </TabsContent>
            
            <TabsContent value="my-gifts" className="mt-6">
              <MyGiftsTab />
            </TabsContent>
            
            <TabsContent value="my-collections" className="mt-6">
              <MyCollectionsTab />
            </TabsContent>
            
            <TabsContent value="group-projects" className="mt-6">
              <GroupProjectsTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </EventsProvider>
  );
};

export default GiftingHubCard;