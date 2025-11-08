import React from "react";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import GiftingHubCard from "@/components/dashboard/GiftingHubCard";
import { EventsProvider } from "@/components/gifting/events/context/EventsContext";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const GiftingHub = () => {
  const handleTestEmail = async () => {
    try {
      console.log('🧪 Testing auto-gift rule created email...');
      
      const { data, error } = await supabase.functions.invoke('ecommerce-email-orchestrator', {
        body: {
          eventType: 'auto_gift_rule_created',
          recipientEmail: 'justin@elyphant.com',
          data: {
            recipient_name: 'Charles Meeks',
            recipient_email: 'justincmeeks@hotmail.com',
            rule_details: {
              occasion: 'birthday',
              budget_limit: 50,
              is_recurring: true,
              next_event_date: '2025-12-25'
            },
            auto_approve_enabled: true
          }
        }
      });

      if (error) {
        console.error('❌ Error sending test email:', error);
        toast.error(`Failed to send email: ${error.message}`);
        return;
      }

      console.log('✅ Email sent successfully:', data);
      toast.success('Test email sent! Check justin@elyphant.com');
    } catch (err) {
      console.error('❌ Exception:', err);
      toast.error('Failed to send test email');
    }
  };

  return (
    <SidebarLayout>
      <div className="container max-w-6xl mx-auto py-4 sm:py-8 px-3 sm:px-4 pb-[140px] sm:pb-safe-bottom mobile-container ios-scroll">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                Gifting
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Manage your gift events, auto-gifting settings, and group projects
              </p>
            </div>
            <Button onClick={handleTestEmail} variant="outline" size="sm">
              🧪 Test Email
            </Button>
          </div>
        </div>
        
        <EventsProvider>
          <GiftingHubCard />
        </EventsProvider>
      </div>
    </SidebarLayout>
  );
};

export default GiftingHub;