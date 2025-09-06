import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Gift, Calendar, Heart, Package, Zap, Search, Plus, Eye, Clock, Bot, Users, Target, Edit, Pause, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GiftPathSelector } from "@/components/gifting/unified/GiftPathSelector";
import { MyGiftsDashboardSimplified } from "@/components/gifting/unified/MyGiftsDashboardSimplified";
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

// Import auto-gifting hook and settings dialog
import { useAutoGifting } from "@/hooks/useAutoGifting";
import { AutoGiftSettingsDialog } from "@/components/gifting/AutoGiftSettingsDialog";

// Enhanced Smart Gifting Tab Component (Primary Hub)
const SmartGiftingTab = () => {
  const { events, isLoading: eventsLoading } = useEvents();
  const { pendingInvitations, loading: connectionsLoading } = useEnhancedConnections();
  const { user } = useAuth();
  const { rules } = useAutoGifting();
  const [autoGiftSetupOpen, setAutoGiftSetupOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedEventForSetup, setSelectedEventForSetup] = useState<any>(null);

  // Quick Stats for dashboard
  const activeRules = rules?.filter(rule => rule.is_active) || [];
  const scheduledGifts = activeRules?.filter(rule => (rule as any).scheduled_date) || [];
  const recentGifts = []; // TODO: Integrate with gift history

  const upcomingEvents = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Combine regular events and scheduled auto-gifts
    const allUpcomingEvents = [];
    
    // Add regular events
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
      });
    
    allUpcomingEvents.push(...eventsWithDays);
    
    // Add scheduled auto-gifts from rules
    const scheduledAutoGifts = activeRules
      .filter(rule => (rule as any).scheduled_date)
      .map(rule => {
        const ruleWithSchedule = rule as any;
        const scheduledDate = new Date(ruleWithSchedule.scheduled_date);
        if (scheduledDate < today) return null;
        
        const daysAway = Math.ceil((scheduledDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        // Create a pseudo-event for display
        return {
          id: `auto-gift-${rule.id}`,
          type: rule.date_type || 'Auto Gift',
          person: ruleWithSchedule.pending_recipient_email?.split('@')[0] || 'Scheduled Gift',
          date: ruleWithSchedule.scheduled_date,
          dateObj: scheduledDate,
          daysAway,
          urgency: daysAway <= 7 ? 'high' : daysAway <= 30 ? 'medium' : 'low',
          autoGiftEnabled: true,
          autoGiftAmount: rule.budget_limit,
          isScheduledAutoGift: true,
          ruleId: rule.id
        };
      })
      .filter(Boolean);
    
    allUpcomingEvents.push(...scheduledAutoGifts);
    
    return allUpcomingEvents
      .sort((a, b) => {
        if (!a.dateObj || !b.dateObj) return 0;
        return a.dateObj.getTime() - b.dateObj.getTime();
      })
      .slice(0, 4);
  }, [events, activeRules]);

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

  const handleScheduleGift = () => {
    window.location.href = '/marketplace';
  };

  const handleViewHistory = () => {
    // Switch to My Gifts tab to see full history
    const tabsList = document.querySelector('[data-testid="tabs-list"]');
    const myGiftsTab = tabsList?.querySelector('[value="my-gifts"]');
    if (myGiftsTab) {
      (myGiftsTab as HTMLElement).click();
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

      {/* Quick Actions Bar */}
      <div className="flex flex-wrap gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <Button 
          onClick={() => setAutoGiftSetupOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Auto-Gift Rule
        </Button>
        <Button 
          variant="outline"
          onClick={handleScheduleGift}
          className="flex items-center gap-2"
        >
          <Calendar className="h-4 w-4" />
          Schedule Gift
        </Button>
        <Button 
          variant="outline"
          onClick={handleViewHistory}
          className="flex items-center gap-2"
        >
          <Eye className="h-4 w-4" />
          View History
        </Button>
        <Button 
          variant="outline"
          onClick={() => setSettingsOpen(true)}
          className="flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Button>
      </div>

      {/* Enhanced Upcoming Events Section with Quick Stats */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Zap className="h-5 w-5 mr-2 text-emerald-500" />
            Upcoming Events
          </h3>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Bot className="h-4 w-4" />
              {activeRules.length} Rules Active
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {scheduledGifts.length} Scheduled
            </span>
            <span className="flex items-center gap-1">
              <Gift className="h-4 w-4" />
              {recentGifts.length} Recent
            </span>
          </div>
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
                
                <div className="flex items-center justify-between mb-3">
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
                  </div>
                </div>

                {/* Event Actions */}
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => handleScheduleGift()}
                    className="flex-1"
                  >
                    Send Now
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleSetupAutoGift(event)}
                    className="flex-1"
                  >
                    {event.autoGiftEnabled ? 'Edit Auto-Gift' : 'Setup Auto-Gift'}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleScheduleGift()}
                  >
                    Schedule Later
                  </Button>
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

      {/* Recent Activity Preview */}
      {recentGifts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Recent Activity</h3>
            <Button variant="ghost" size="sm" onClick={handleViewHistory}>
              View All
            </Button>
          </div>
          <div className="space-y-2">
            {recentGifts.slice(0, 3).map((gift: any) => (
              <div key={gift.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Gift className="h-4 w-4 text-emerald-500" />
                  <div>
                    <p className="font-medium">{gift.recipientName}</p>
                    <p className="text-sm text-muted-foreground">{gift.productName}</p>
                  </div>
                </div>
                <Badge variant="outline">{gift.status}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

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

      {/* Auto-Gift Settings Dialog */}
      <AutoGiftSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
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

// Simplified My Gifts Tab Component (Tracking Focus)
const MyGiftsTab = () => {
  const [autoGiftSetupOpen, setAutoGiftSetupOpen] = useState(false);

  const handleEditRule = (ruleId: string) => {
    console.log('Edit rule:', ruleId);
    setAutoGiftSetupOpen(true);
  };

  const handleScheduleGift = () => {
    window.location.href = '/marketplace';
  };

  const handleSwitchToSmartGifting = () => {
    const tabsList = document.querySelector('[data-testid="tabs-list"]');
    const smartGiftingTab = tabsList?.querySelector('[value="smart-gifting"]');
    if (smartGiftingTab) {
      (smartGiftingTab as HTMLElement).click();
    }
  };

  return (
    <div className="space-y-6">
      <MyGiftsDashboardSimplified 
        onEditRule={handleEditRule}
        onScheduleGift={handleScheduleGift}
        onSwitchToSmartGifting={handleSwitchToSmartGifting}
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
        <CardHeader className="pb-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              Your comprehensive gift management center
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2" data-testid="tabs-list">
              <TabsTrigger value="smart-gifting">Smart Gifting</TabsTrigger>
              <TabsTrigger value="my-gifts">My Gifts</TabsTrigger>
            </TabsList>
            
            <TabsContent value="smart-gifting" className="mt-6">
              <SmartGiftingTab />
            </TabsContent>
            
            <TabsContent value="my-gifts" className="mt-6">
              <MyGiftsTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </EventsProvider>
  );
};

export default GiftingHubCard;