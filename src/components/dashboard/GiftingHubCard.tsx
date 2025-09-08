import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Gift, 
  Calendar, 
  Heart, 
  Package, 
  Zap, 
  Search, 
  Plus, 
  Eye, 
  Clock, 
  Bot, 
  Users, 
  Target, 
  Pause, 
  Settings 
} from "lucide-react";
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
import { toast } from "sonner";
import { useUnifiedWishlistSystem } from "@/hooks/useUnifiedWishlistSystem";
import { unifiedGiftManagementService } from "@/services/UnifiedGiftManagementService";
import { EventsProvider, useEvents } from "@/components/gifting/events/context/EventsContext";
import { useEnhancedConnections } from "@/hooks/profile/useEnhancedConnections";
import { getUserOrders, Order } from "@/services/orderService";

import ProductDetailsDialog from "@/components/marketplace/ProductDetailsDialog";
import { supabase } from "@/integrations/supabase/client";
import { standardizeProduct } from '@/components/marketplace/product-item/productUtils';
import { fetchProductDetails } from '@/components/marketplace/zinc/services/productDetailsService';

// Import group components
import ActiveGroupProjectsWidget from "./ActiveGroupProjectsWidget";
import GroupGiftAnalytics from "./GroupGiftAnalytics";

// Import auto-gifting hook and settings dialog
import { useAutoGifting } from "@/hooks/useAutoGifting";
import { AutoGiftSettingsDialog } from "@/components/gifting/AutoGiftSettingsDialog";

// Import new hooks and components
import RecipientEventsWidget from "@/components/gifting/widgets/RecipientEventsWidget";
import ScheduledGiftsSection from "@/components/gifting/sections/ScheduledGiftsSection";
import GiftActivityFeed from "@/components/gifting/sections/GiftActivityFeed";

// Enhanced Smart Gifting Tab Component (Gift Opportunities & Setup)
const SmartGiftingTab = () => {
  console.log('🎯🎯🎯 SmartGiftingTab: Component mounting - restructured for gift opportunities');
  const { user } = useAuth();
  const { rules } = useAutoGifting();
  const [autoGiftSetupOpen, setAutoGiftSetupOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  // Quick Stats for dashboard
  const activeRules = rules?.filter(rule => rule.is_active) || [];

  // Helper function to get friendly date type names
  const getFriendlyDateType = (dateType: string) => {
    const friendlyNames: Record<string, string> = {
      'just_because': 'Surprise Gift',
      'birthday': 'Birthday',
      'anniversary': 'Anniversary',
      'valentines_day': "Valentine's Day",
      'mothers_day': "Mother's Day",
      'fathers_day': "Father's Day",
      'christmas': 'Christmas',
      'thanksgiving': 'Thanksgiving',
      'new_year': 'New Year',
      'graduation': 'Graduation',
      'wedding': 'Wedding'
    };
    return friendlyNames[dateType] || dateType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Helper function to calculate next occurrence for recurring events
  const calculateNextOccurrence = (dateType: string, scheduledDate?: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (scheduledDate) {
      const date = new Date(scheduledDate);
      if (date >= today) return date;
    }
    
    // For recurring events like birthdays/anniversaries, calculate next year if past
    if (dateType === 'birthday' || dateType === 'anniversary') {
      const currentYear = today.getFullYear();
      let nextOccurrence = new Date(currentYear, 5, 15); // Default to mid-year if no specific date
      
      if (scheduledDate) {
        const originalDate = new Date(scheduledDate);
        nextOccurrence = new Date(currentYear, originalDate.getMonth(), originalDate.getDate());
        
        // If this year's occurrence has passed, move to next year
        if (nextOccurrence < today) {
          nextOccurrence.setFullYear(currentYear + 1);
        }
      }
      
      return nextOccurrence;
    }
    
    // For holidays, return a reasonable default
    const holidays: Record<string, [number, number]> = {
      'valentines_day': [1, 14], // Feb 14
      'mothers_day': [4, 12], // May 12 (approx second Sunday)
      'fathers_day': [5, 16], // June 16 (approx third Sunday)
      'christmas': [11, 25], // Dec 25
      'thanksgiving': [10, 28], // Nov 28 (approx fourth Thursday)
      'new_year': [0, 1] // Jan 1
    };
    
    if (holidays[dateType]) {
      const [month, day] = holidays[dateType];
      const currentYear = today.getFullYear();
      let holidayDate = new Date(currentYear, month, day);
      
      if (holidayDate < today) {
        holidayDate.setFullYear(currentYear + 1);
      }
      
      return holidayDate;
    }
    
    // Default fallback - return scheduled date or 30 days from now
    return scheduledDate ? new Date(scheduledDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  };

  // Remove the complex event computation - we'll use the new RecipientEventsWidget

  // Remove product image fetching logic as it's no longer needed

  const handleSetupAutoGift = async (event: any) => {
    setSelectedEvent(event);
    setAutoGiftSetupOpen(true);
  };

  // Calculate if a rule can be cancelled based on timing restrictions
  const canCancelRule = (nextDate: Date): { canCancel: boolean; reason?: string; hoursUntil?: number } => {
    const now = new Date();
    const hoursUntilExecution = (nextDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    // 24-hour restriction window before execution
    const CANCELLATION_CUTOFF_HOURS = 24;
    
    if (hoursUntilExecution < CANCELLATION_CUTOFF_HOURS) {
      return {
        canCancel: false,
        reason: `Cannot cancel auto-gift within ${CANCELLATION_CUTOFF_HOURS} hours of execution`,
        hoursUntil: Math.round(hoursUntilExecution)
      };
    }
    
    return { canCancel: true, hoursUntil: Math.round(hoursUntilExecution) };
  };

  const handleCancelAutoGift = async (event: any) => {
    if (!event.isScheduledAutoGift || !event.ruleId) {
      toast.error("Cannot cancel this gift");
      return;
    }

    try {
      // Use the enhanced cancellation system to check what can be cancelled
      const cancellationCheck = await unifiedGiftManagementService.canCancelRule(event.ruleId);
      
      if (!cancellationCheck.canCancel) {
        toast.error(cancellationCheck.reason);
        return;
      }

      // Show comprehensive cancellation dialog
      const executionInfo = Object.entries(cancellationCheck.executions)
        .filter(([key, count]) => (count as number) > 0)
        .map(([key, count]) => `${count} ${key} execution${count !== 1 ? 's' : ''}`)
        .join(', ');

      const timingInfo = cancellationCheck.nextExecution 
        ? `\n⏰ Next execution: ${cancellationCheck.nextExecution.toLocaleDateString()}`
        : '';

      const message = executionInfo 
        ? `Cancel auto-gift for ${event.person}'s ${event.type}?${timingInfo}\n\nThis will also cancel: ${executionInfo}\n\nThis action cannot be undone.`
        : `Cancel auto-gift for ${event.person}'s ${event.type}?${timingInfo}\n\nThis action cannot be undone.`;

      const confirmed = window.confirm(message);

      if (!confirmed) return;

      // Use the enhanced cancellation method
      const result = await unifiedGiftManagementService.cancelAutoGiftRule(event.ruleId, "Cancelled by user from dashboard");
      
      if (result.success) {
        toast.success(result.message);
        // Refresh the rules data to update the UI
        window.location.reload();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error cancelling auto-gift:', error);
      toast.error("Failed to cancel auto-gift");
    }
  };

  const handleSendGift = (event: any) => {
    // Navigate to marketplace with Nicole for immediate gift selection
    window.location.href = `/marketplace?mode=nicole&open=true&recipient=${encodeURIComponent(event.recipientName)}&occasion=${encodeURIComponent(event.eventType)}`;
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

  // Remove loading state check

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
                
                {/* Product Details or Budget Info */}
                {event.execution?.selectedProduct ? (
                  <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                        {event.execution.selectedProduct.image ? (
                          <img
                            src={productImages[event.id] || event.execution.selectedProduct.image}
                            alt={event.execution.selectedProduct.name}
                            className="w-12 h-12 rounded-md object-cover"
                            onError={(e) => {
                              console.log('❌ GiftingHubCard: Image failed to load:', productImages[event.id] || event.execution.selectedProduct.image);
                              console.log('❌ GiftingHubCard: Event ID:', event.id);
                              console.log('❌ GiftingHubCard: Product:', event.execution?.selectedProduct);
                              
                              // Replace with gift icon placeholder
                              const placeholder = document.createElement('div');
                              placeholder.className = 'w-12 h-12 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center';
                              placeholder.innerHTML = '<svg class="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 0 002-2v-7"></path></svg>';
                              e.currentTarget.parentNode?.replaceChild(placeholder, e.currentTarget);
                            }}
                            onLoad={() => {
                              console.log('✅ GiftingHubCard: Image loaded successfully:', productImages[event.id] || event.execution.selectedProduct.image);
                            }}
                          />
                        ) : (
                          <Gift className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-sm truncate">
                          {event.execution.selectedProduct.name}
                        </h5>
                        <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                          ${event.execution.selectedProduct.price}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            <Bot className="h-3 w-3 mr-1" />
                            Selected by {event.execution.aiAgent.name}
                          </Badge>
                          {event.execution.aiAgent.confidenceScore > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {Math.round(event.execution.aiAgent.confidenceScore * 100)}% confidence
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mb-3">
                    <p className="text-sm text-muted-foreground">
                      {event.dateObj ? format(event.dateObj, 'MMM d, yyyy') : event.date}
                    </p>
                    {event.budgetDisplay && (
                      <p className="text-xs text-muted-foreground">
                        Budget: {event.budgetDisplay} • AI will select gift
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        <Bot className="h-3 w-3 mr-1" />
                        AI Autopilot
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Event Actions */}
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => handleSendNow(event)}
                    className="flex-1"
                  >
                    Send Gift
                  </Button>
                  {event.isScheduledAutoGift && (() => {
                    const cancellationStatus = canCancelRule(event.dateObj);
                    const isNearExecution = cancellationStatus.hoursUntil && cancellationStatus.hoursUntil < 48;
                    
                    return (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleCancelAutoGift(event)}
                        disabled={!cancellationStatus.canCancel}
                        className={`flex-1 ${isNearExecution ? 'text-orange-600 border-orange-200' : ''}`}
                        title={
                          !cancellationStatus.canCancel 
                            ? cancellationStatus.reason 
                            : isNearExecution 
                              ? `Cancel within ${cancellationStatus.hoursUntil}h` 
                              : 'Cancel auto-gift'
                        }
                      >
                        <Pause className="h-3 w-3 mr-1" />
                        Cancel Auto-Gift
                      </Button>
                    );
                  })()}
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
        initialData={selectedEventForSetup?.initialData}
        ruleId={selectedEventForSetup?.autoGiftRuleId}
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
  console.log('🚀🚀🚀 MAIN GiftingHubCard: Component mounting at', new Date().toISOString());
  const [activeTab, setActiveTab] = useState("smart-gifting");
  console.log('📋📋📋 MAIN GiftingHubCard: Active tab set to:', activeTab);

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