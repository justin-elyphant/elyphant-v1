import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, Mail, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface TestEmailModalProps {
  template: {
    id: string; // event type value e.g. "order_confirmation"
    name: string;
    description: string;
    template_type: string;
    subject_template: string;
    html_template: string;
    is_active: boolean;
    version: number;
  };
  variables: any[];
  onClose: () => void;
}

const TestEmailModal: React.FC<TestEmailModalProps> = ({
  template,
  onClose,
}) => {
  const [testEmail, setTestEmail] = useState("");
  const [sending, setSending] = useState(false);

  const handleSendTest = async () => {
    if (!testEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setSending(true);
    try {
      // Use the orchestrator directly — it sends via Resend
      const { data, error } = await supabase.functions.invoke(
        "ecommerce-email-orchestrator",
        {
          body: {
            eventType: template.id,
            recipientEmail: testEmail,
            data: getSampleDataForEvent(template.id),
          },
        }
      );

      if (error) throw error;

      toast.success(`Test email sent to ${testEmail}`);
      onClose();
    } catch (error: any) {
      console.error("Error sending test email:", error);
      toast.error(error.message || "Failed to send test email");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send Test: {template.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Recipient
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Label htmlFor="testEmail">Email address</Label>
              <Input
                id="testEmail"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="you@example.com"
              />
              <p className="text-xs text-muted-foreground mt-1">
                A real email will be sent via the orchestrator with sample data.
              </p>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-4">
              <div className="flex gap-2 text-yellow-800">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <p className="text-xs">
                  This sends a real email through Resend. Make sure RESEND_API_KEY
                  is configured in your edge function secrets.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSendTest} disabled={sending || !testEmail}>
            {sending ? "Sending..." : "Send Test Email"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Sample data matching what EmailTemplatesManager defines
function getSampleDataForEvent(eventType: string): Record<string, any> {
  const samples: Record<string, Record<string, any>> = {
    order_confirmation: {
      customer_name: "Sarah Chen",
      order_number: "ORD-TEST01",
      order_id: "00000000-0000-0000-0000-000000000001",
      total_amount: 89.99,
      subtotal: 79.99,
      shipping_cost: 5.0,
      tax_amount: 5.0,
      gifting_fee: 0,
      items: [{ title: "Wireless Headphones", quantity: 1, price: 79.99 }],
      shipping_address: { name: "Sarah Chen", line1: "123 Main St", city: "San Francisco", state: "CA", zip: "94102" },
      is_gift: false,
    },
    welcome_email: { first_name: "Sarah" },
    connection_invitation: {
      sender_name: "Michael Chen",
      recipient_name: "Sarah",
      has_pending_gift: false,
      personal_message: "Hey, let's connect on Elyphant!",
      invitation_url: "https://elyphant.com/invite/test",
    },
    connection_established: { connection_name: "Michael Chen", user_name: "Sarah" },
    connection_request: { sender_name: "Alex Rivera", recipient_name: "Sarah" },
    nudge_reminder: { sender_name: "Michael Chen", recipient_name: "Sarah", nudge_count: 2 },
    wishlist_shared: { sender_name: "Michael Chen", wishlist_name: "Birthday Wishes", item_count: 8 },
    auto_gift_approval: {
      recipient_name: "Mom",
      occasion: "birthday",
      product_title: "Silk Scarf",
      product_price: 49.99,
      approval_url: "https://elyphant.com/approve/test",
      execution_id: "exec-test",
      scheduled_date: "2025-05-10",
    },
    auto_gift_rule_created: { recipient_name: "Mom", occasion: "birthday", budget_limit: 75 },
    gift_coming_your_way: { sender_name: "Michael", recipient_name: "Sarah", gift_message: "Happy birthday!" },
    auto_gift_payment_failed: { recipient_name: "Mom", occasion: "birthday", product_title: "Silk Scarf", error_message: "Card declined." },
    order_shipped: {
      customer_name: "Sarah Chen",
      order_number: "ORD-TEST01",
      items: [{ title: "Wireless Headphones", quantity: 1, price: 79.99 }],
      tracking_number: "1Z999TEST",
      tracking_url: "https://www.amazon.com/progress-tracker/package/?itemId=1Z999TEST",
      estimated_delivery: "2025-04-15",
      is_gift: false,
    },
    order_failed: {
      customer_name: "Sarah Chen",
      order_number: "ORD-TEST01",
      items: [{ title: "Wireless Headphones", quantity: 1, price: 79.99 }],
      error_message: "Item out of stock.",
    },
    order_pending_payment: {
      customer_name: "Sarah Chen",
      order_number: "ORD-TEST02",
      total_amount: 49.99,
      items: [{ title: "Silk Scarf", quantity: 1, price: 49.99 }],
      scheduled_date: "2025-12-25",
      is_gift: true,
      gift_message: "Happy holidays!",
    },
    guest_order_confirmation: {
      customer_name: "Guest Shopper",
      order_number: "ORD-GUEST1",
      total_amount: 34.99,
      items: [{ title: "Scented Candle Set", quantity: 1, price: 34.99 }],
      guest_email: "guest@example.com",
      is_gift: false,
    },
    zma_low_balance_alert: { current_balance: 12.5, minimum_balance: 50.0, is_critical: false },
    vendor_new_order: { vendor_name: "Artisan Co.", order_number: "ORD-V1", item_count: 2, total_amount: 124.0, items: [{ title: "Ceramic Mug", quantity: 1, price: 34.0 }] },
    vendor_application_received: { company_name: "Artisan Co.", contact_name: "Jamie" },
    vendor_application_approved: { company_name: "Artisan Co.", contact_name: "Jamie" },
    vendor_application_rejected: { company_name: "Artisan Co.", contact_name: "Jamie", rejection_reason: "Incomplete catalog" },
    beta_approved: { recipient_name: "Sarah Chen", credit_amount: 100 },
    beta_approval_needed: { invitee_name: "Alex Rivera", invitee_email: "alex@example.com", referrer_name: "Michael Chen", referrer_email: "michael@example.com" },
    beta_invite_welcome: { sender_name: "Michael Chen", recipient_name: "Sarah", credit_amount: 100, invitation_url: "https://elyphant.com/invite/beta-test" },
    beta_checkin: {
      recipient_name: "Sarah Chen",
      feedback_url: "https://elyphant.ai/beta-feedback?token=sample-token",
      has_wishlist: true,
      has_invited: false,
      has_scheduled_gift: false,
      has_purchased: true,
      wishlist_count: 3,
      order_count: 1,
      features_used: 4,
    },
  };
  return samples[eventType] || {};
}

export default TestEmailModal;
