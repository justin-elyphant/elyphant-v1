import React, { useState } from "react";
import { Eye, Send, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import EmailPreviewModal from "./EmailPreviewModal";
import TestEmailModal from "./TestEmailModal";

// ── Event type registry with labels + sample data ──────────────────────

const EVENT_TYPES: { value: string; label: string; category: string; sampleData: Record<string, any> }[] = [
  // Consumer — Orders
  {
    value: "order_confirmation",
    label: "Order Confirmation",
    category: "Orders",
    sampleData: {
      customer_name: "Sarah Chen",
      order_number: "ORD-A1B2C3",
      order_id: "00000000-0000-0000-0000-000000000001",
      total_amount: 89.99,
      subtotal: 79.99,
      shipping_cost: 5.00,
      tax_amount: 5.00,
      gifting_fee: 0,
      items: [
        { title: "Wireless Noise-Cancelling Headphones", quantity: 1, price: 79.99, image_url: "" },
      ],
      shipping_address: { name: "Sarah Chen", line1: "123 Main St", city: "San Francisco", state: "CA", zip: "94102" },
      is_gift: false,
    },
  },
  {
    value: "order_pending_payment",
    label: "Order Scheduled (Pending)",
    category: "Orders",
    sampleData: {
      customer_name: "Sarah Chen",
      order_number: "ORD-D4E5F6",
      order_id: "00000000-0000-0000-0000-000000000002",
      total_amount: 49.99,
      items: [{ title: "Silk Scarf", quantity: 1, price: 49.99 }],
      scheduled_date: "2025-12-25",
      is_gift: true,
      gift_message: "Happy holidays — thinking of you!",
      shipping_address: { name: "Mom", line1: "456 Oak Ave", city: "Portland", state: "OR", zip: "97201" },
    },
  },
  {
    value: "order_shipped",
    label: "Order Shipped",
    category: "Orders",
    sampleData: {
      customer_name: "Sarah Chen",
      order_number: "ORD-A1B2C3",
      order_id: "00000000-0000-0000-0000-000000000001",
      total_amount: 89.99,
      items: [{ title: "Wireless Noise-Cancelling Headphones", quantity: 1, price: 79.99 }],
      tracking_number: "1Z999AA10123456784",
      tracking_url: "https://www.amazon.com/progress-tracker/package/?itemId=1Z999AA10123456784",
      estimated_delivery: "2025-04-15",
      shipping_address: { name: "Sarah Chen", line1: "123 Main St", city: "San Francisco", state: "CA", zip: "94102" },
      is_gift: false,
    },
  },
  {
    value: "order_failed",
    label: "Order Failed",
    category: "Orders",
    sampleData: {
      customer_name: "Sarah Chen",
      order_number: "ORD-A1B2C3",
      order_id: "00000000-0000-0000-0000-000000000001",
      total_amount: 89.99,
      items: [{ title: "Wireless Noise-Cancelling Headphones", quantity: 1, price: 79.99 }],
      error_message: "The item is currently out of stock from the supplier.",
    },
  },
  {
    value: "guest_order_confirmation",
    label: "Guest Order Confirmation",
    category: "Orders",
    sampleData: {
      customer_name: "Guest Shopper",
      order_number: "ORD-G7H8I9",
      order_id: "00000000-0000-0000-0000-000000000003",
      total_amount: 34.99,
      items: [{ title: "Scented Candle Set", quantity: 1, price: 34.99 }],
      shipping_address: { name: "Guest Shopper", line1: "789 Pine St", city: "Austin", state: "TX", zip: "78701" },
      guest_email: "guest@example.com",
      is_gift: false,
    },
  },
  // Consumer — Social
  {
    value: "welcome_email",
    label: "Welcome Email",
    category: "Social",
    sampleData: { first_name: "Sarah" },
  },
  {
    value: "connection_invitation",
    label: "Connection Invitation",
    category: "Social",
    sampleData: {
      sender_name: "Michael Chen",
      recipient_name: "Sarah",
      has_pending_gift: false,
      personal_message: "Hey Sarah, let's connect on Elyphant so we can share wishlists!",
      invitation_url: "https://elyphant.com/invite/abc123",
    },
  },
  {
    value: "connection_established",
    label: "Connection Established",
    category: "Social",
    sampleData: {
      connection_name: "Michael Chen",
      user_name: "Sarah",
    },
  },
  {
    value: "connection_request",
    label: "Connection Request",
    category: "Social",
    sampleData: {
      sender_name: "Alex Rivera",
      recipient_name: "Sarah",
      personal_message: "Hi Sarah, I'd love to connect with you on Elyphant.",
    },
  },
  {
    value: "nudge_reminder",
    label: "Nudge Reminder",
    category: "Social",
    sampleData: {
      sender_name: "Michael Chen",
      recipient_name: "Sarah",
      nudge_count: 2,
    },
  },
  {
    value: "wishlist_shared",
    label: "Wishlist Shared",
    category: "Social",
    sampleData: {
      sender_name: "Michael Chen",
      wishlist_name: "Birthday Wishes",
      item_count: 8,
      wishlist_url: "https://elyphant.com/wishlist/abc123",
    },
  },
  // Consumer — Gifts
  {
    value: "auto_gift_approval",
    label: "Auto-Gift Approval",
    category: "Gifts",
    sampleData: {
      recipient_name: "Mom",
      occasion: "birthday",
      product_title: "Silk Scarf",
      product_image: "",
      product_price: 49.99,
      approval_url: "https://elyphant.com/approve/abc123",
      execution_id: "exec-123",
      scheduled_date: "2025-05-10",
    },
  },
  {
    value: "auto_gift_rule_created",
    label: "Auto-Gift Rule Created",
    category: "Gifts",
    sampleData: {
      recipient_name: "Mom",
      occasion: "birthday",
      budget_limit: 75,
      scheduled_date: "2025-05-10",
    },
  },
  {
    value: "gift_coming_your_way",
    label: "Gift Coming Your Way",
    category: "Gifts",
    sampleData: {
      sender_name: "Michael",
      recipient_name: "Sarah",
      gift_message: "Happy birthday! Hope you love it.",
    },
  },
  {
    value: "auto_gift_payment_failed",
    label: "Auto-Gift Payment Failed",
    category: "Gifts",
    sampleData: {
      recipient_name: "Mom",
      occasion: "birthday",
      product_title: "Silk Scarf",
      error_message: "Card ending in 4242 was declined.",
      retry_url: "https://elyphant.com/auto-gifts/retry/abc123",
    },
  },
  // System
  {
    value: "zma_low_balance_alert",
    label: "ZMA Low Balance Alert",
    category: "System",
    sampleData: {
      current_balance: 12.50,
      minimum_balance: 50.00,
      is_critical: false,
    },
  },
  // Vendor
  {
    value: "vendor_new_order",
    label: "Vendor New Order",
    category: "Vendor",
    sampleData: {
      vendor_name: "Artisan Co.",
      order_number: "ORD-V1V2V3",
      item_count: 2,
      total_amount: 124.00,
      items: [
        { title: "Handmade Ceramic Mug", quantity: 1, price: 34.00 },
        { title: "Linen Tea Towel Set", quantity: 1, price: 90.00 },
      ],
    },
  },
  {
    value: "vendor_application_received",
    label: "Vendor Application Received",
    category: "Vendor",
    sampleData: { company_name: "Artisan Co.", contact_name: "Jamie" },
  },
  {
    value: "vendor_application_approved",
    label: "Vendor Application Approved",
    category: "Vendor",
    sampleData: { company_name: "Artisan Co.", contact_name: "Jamie" },
  },
  {
    value: "vendor_application_rejected",
    label: "Vendor Application Rejected",
    category: "Vendor",
    sampleData: { company_name: "Artisan Co.", contact_name: "Jamie", rejection_reason: "Incomplete product catalog" },
  },
  // Beta Program
  {
    value: "beta_approved",
    label: "Beta Approved (Welcome)",
    category: "Beta Program",
    sampleData: {
      customer_name: "Sarah Chen",
      first_name: "Sarah",
      credit_amount: 100,
    },
  },
  {
    value: "beta_approval_needed",
    label: "Beta Approval Needed (Internal)",
    category: "Beta Program",
    sampleData: {
      applicant_name: "Alex Rivera",
      applicant_email: "alex@example.com",
      referrer_name: "Michael Chen",
    },
  },
  {
    value: "beta_invite_welcome",
    label: "Beta Invite Welcome",
    category: "Beta Program",
    sampleData: {
      sender_name: "Michael Chen",
      recipient_name: "Sarah",
      credit_amount: 100,
      invitation_url: "https://elyphant.com/invite/beta-abc123",
    },
  },
];

const CATEGORIES = [...new Set(EVENT_TYPES.map((e) => e.category))];

const EmailTemplatesManager = () => {
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);

  const selected = EVENT_TYPES.find((e) => e.value === selectedEvent);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Email Templates</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Live preview of all email templates rendered by the orchestrator
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="w-full max-w-sm space-y-1.5">
          <label className="text-sm font-medium">Event type</label>
          <Select value={selectedEvent} onValueChange={setSelectedEvent}>
            <SelectTrigger>
              <SelectValue placeholder="Select an email template..." />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectGroup key={cat}>
                  <SelectLabel className="text-xs uppercase tracking-wider text-muted-foreground">
                    {cat}
                  </SelectLabel>
                  {EVENT_TYPES.filter((e) => e.category === cat).map((e) => (
                    <SelectItem key={e.value} value={e.value}>
                      {e.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => setShowPreview(true)}
            disabled={!selected}
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            Preview
          </Button>
          <Button
            onClick={() => setShowTestModal(true)}
            disabled={!selected}
            variant="outline"
            className="gap-2"
          >
            <Send className="h-4 w-4" />
            Send Test
          </Button>
        </div>
      </div>

      {/* Event cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {EVENT_TYPES.map((evt) => (
          <Card
            key={evt.value}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedEvent === evt.value ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => setSelectedEvent(evt.value)}
            onDoubleClick={() => {
              setSelectedEvent(evt.value);
              setShowPreview(true);
            }}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{evt.label}</CardTitle>
                <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                  {evt.category}
                </Badge>
              </div>
              <CardDescription className="text-xs">
                {evt.value}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex gap-1.5 mt-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 gap-1 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedEvent(evt.value);
                    setShowPreview(true);
                  }}
                >
                  <Monitor className="h-3 w-3" />
                  Preview
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modals */}
      {showPreview && selected && (
        <EmailPreviewModal
          eventType={selected.value}
          eventLabel={selected.label}
          sampleData={selected.sampleData}
          onClose={() => setShowPreview(false)}
        />
      )}

      {showTestModal && selected && (
        <TestEmailModal
          template={{
            id: selected.value,
            name: selected.label,
            description: "",
            template_type: selected.category,
            subject_template: "",
            html_template: "",
            is_active: true,
            version: 1,
          }}
          variables={[]}
          onClose={() => setShowTestModal(false)}
        />
      )}
    </div>
  );
};

export default EmailTemplatesManager;
