// GiftingHubCard - Clean Smart Gifting Only - v3
import React, { useState, useEffect } from "react";
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
import { useNavigate } from "react-router-dom";
import { formatRecipientNameForUrl, clearPersonalizedData } from "@/utils/personalizedMarketplaceUtils";

import ProductDetailsDialog from "@/components/marketplace/ProductDetailsDialog";
import { supabase } from "@/integrations/supabase/client";
import { standardizeProduct } from '@/components/marketplace/product-item/productUtils';
import { fetchProductDetails } from '@/components/marketplace/zinc/services/productDetailsService';

// Import auto-gifting hook and settings dialog
import { useAutoGifting } from "@/hooks/useAutoGifting";
import { AutoGiftSettingsDialog } from "@/components/gifting/AutoGiftSettingsDialog";

// Import new hooks and components
import RecipientEventsWidget from "@/components/gifting/widgets/RecipientEventsWidget";
import ScheduledGiftsSection from "@/components/gifting/sections/ScheduledGiftsSection";
import GiftActivityFeed from "@/components/gifting/sections/GiftActivityFeed";

// Enhanced Smart Gifting Tab Component (Gift Opportunities & Setup)
const SmartGiftingTab = () => {
  console.log('🎯🎯🎯 SmartGiftingTab: CLEANED VERSION - NO AUTO-GIFT/GROUP SECTIONS');
  console.log('🔍 File timestamp check:', Date.now());
  const { user } = useAuth();
  const { rules } = useAutoGifting();
  const navigate = useNavigate();
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

  const handleSetupAutoGift = async (event: any) => {
    console.log('🎯 handleSetupAutoGift called with event:', event);
    setSelectedEvent(event);
    setAutoGiftSetupOpen(true);
  };

  const handleSendGift = (event: any) => {
    // Clear any existing personalized data first
    clearPersonalizedData();
    
    // Navigate to personalized marketplace page
    const recipientName = formatRecipientNameForUrl(event.recipientName);
    navigate(`/marketplace/for/${recipientName}`, { 
      state: { 
        eventContext: {
          recipientName: event.recipientName,
          eventType: event.eventType,
          eventId: event.id,
          relationship: event.relationshipType || 'friend',
          isPersonalized: true
        }
      }
    });
    toast.success(`Opening personalized gift marketplace for ${event.recipientName}`, {
      description: "Nicole AI is curating personalized recommendations..."
    });
  };

  const handlePathSelection = (path: 'ai-autopilot' | 'manual-control') => {
    if (path === 'ai-autopilot') {
      setAutoGiftSetupOpen(true);
    } else {
      navigate('/marketplace');
    }
  };

  const handleScheduleGift = () => {
    navigate('/marketplace');
  };

  const handleViewHistory = () => {
    // Switch to My Gifts tab to see full history
    const tabsList = document.querySelector('[data-testid="tabs-list"]');
    const myGiftsTab = tabsList?.querySelector('[value="my-gifts"]');
    if (myGiftsTab) {
      (myGiftsTab as HTMLElement).click();
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Gift Path Selector */}
      <div>
        <div className="mb-4 md:mb-6">
          <h3 className="text-base md:text-lg font-semibold mb-2">How would you like to give gifts?</h3>
          <p className="text-xs md:text-sm text-muted-foreground">
            Choose between AI-powered automation or manual gift selection
          </p>
        </div>
        <GiftPathSelector onSelectPath={handlePathSelection} />
      </div>

      {/* Recipient Events - Real recipient events, not auto-gift rules */}
      <RecipientEventsWidget 
        onSetupAutoGift={handleSetupAutoGift}
        onSendGift={handleSendGift}
        maxEvents={5}
      />
      
      {/* Auto-Gift Setup Flow */}
      <AutoGiftSetupFlow
        open={autoGiftSetupOpen}
        onOpenChange={setAutoGiftSetupOpen}
        eventId={selectedEvent?.id}
        eventType={selectedEvent?.initialData?.eventType}
        recipientId={selectedEvent?.initialData?.recipientId}
        initialData={selectedEvent?.initialData}
        ruleId={selectedEvent?.autoGiftRuleId}
      />

      {/* Auto-Gift Settings Dialog */}
      <AutoGiftSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
    </div>
  );
};

// Enhanced My Gifts Tab Component (Tracking & Management)
const MyGiftsTab = () => {
  const navigate = useNavigate();
  const [autoGiftSetupOpen, setAutoGiftSetupOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);

  const handleEditRule = (ruleId: string) => {
    console.log('Edit rule:', ruleId);
    setEditingRule(ruleId);
    setAutoGiftSetupOpen(true);
  };

  const handleScheduleGift = () => {
    navigate('/marketplace');
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
        ruleId={editingRule}
      />
    </div>
  );
};

// Main Gifting Hub Card Component
const GiftingHubCard = () => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <EventsProvider>
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-purple-500" />
            Smart Gifting
          </CardTitle>
          <CardDescription>
            Manage your gifts, automation, and connections
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs defaultValue="smart-gifting" className="w-full">
            <TabsList className="grid w-full grid-cols-2 px-3 md:px-6 marketplace-touch-target" data-testid="tabs-list">
              <TabsTrigger value="smart-gifting" className="min-h-[44px] text-xs md:text-sm">Smart Gifting</TabsTrigger>
              <TabsTrigger value="my-gifts" className="min-h-[44px] text-xs md:text-sm">My Gifts</TabsTrigger>
            </TabsList>
            
            <TabsContent value="smart-gifting" className="mt-4 md:mt-6">
              <div className="px-3 md:px-6 pb-4 md:pb-6 mobile-container">
                <SmartGiftingTab />
              </div>
            </TabsContent>
            
            <TabsContent value="my-gifts" className="mt-4 md:mt-6">
              <div className="px-3 md:px-6 pb-4 md:pb-6 mobile-container">
                <MyGiftsTab />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </EventsProvider>
  );
};

export default GiftingHubCard;