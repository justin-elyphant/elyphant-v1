import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Bell, Gift } from "lucide-react";
import AutoGiftApprovalDashboard from "@/components/gifting/auto-execution/AutoGiftApprovalDashboard";
import { useNotifications } from "@/contexts/notifications/NotificationsContext";

const AutoGiftApprovals = () => {
  const { addNotification } = useNotifications();

  const handleAddDemoNotification = () => {
    addNotification({
      type: "auto_gift_approval",
      title: "Auto-Gift Ready for Approval",
      message: "We've found the perfect gift for Sarah's birthday! Review and approve to send.",
      recipientName: "Sarah",
      eventType: "Birthday",
      selectedProducts: [
        {
          product_id: "1",
          title: "Wireless Bluetooth Headphones",
          price: 89.99,
          category: "Electronics"
        },
        {
          product_id: "2",
          title: "Luxury Scented Candle Set",
          price: 45.99,
          category: "Home & Living"
        }
      ],
      totalAmount: 135.98,
      quickActions: {
        approve: () => {
          console.log("Quick approve clicked");
          addNotification({
            type: "auto_gift_approved",
            title: "Auto-Gift Approved!",
            message: "Your gift for Sarah's birthday has been sent and is on its way.",
            link: "/orders",
            actionText: "Track Order"
          });
        },
        review: () => {
          console.log("Review clicked");
          // This would open the review modal
        }
      }
    });
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Gift className="h-8 w-8 text-primary" />
              Auto-Gift Approvals
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage your AI-powered gift suggestions and approvals
            </p>
          </div>
        </div>
        
        <Button onClick={handleAddDemoNotification} variant="outline" size="sm">
          <Bell className="h-4 w-4 mr-2" />
          Demo Notification
        </Button>
      </div>

      {/* Info Card */}
      <Card className="mb-8 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            How Auto-Gift Approvals Work
          </CardTitle>
          <CardDescription>
            Your user-friendly approval system - designed for e-commerce simplicity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="font-semibold text-sm mb-1">AI Selects Gifts</h3>
              <p className="text-xs text-muted-foreground">
                Our AI analyzes interests and selects 2-3 perfect gifts
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">✉️</span>
              </div>
              <h3 className="font-semibold text-sm mb-1">Instant Notification</h3>
              <p className="text-xs text-muted-foreground">
                Get notified via email, push, and in-app notifications
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">👆</span>
              </div>
              <h3 className="font-semibold text-sm mb-1">One-Click Approval</h3>
              <p className="text-xs text-muted-foreground">
                Quick approve or review & customize before sending
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Dashboard */}
      <AutoGiftApprovalDashboard />

      {/* Future Features Preview */}
      <Card className="mt-8 border-dashed border-2 border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-muted-foreground" />
            Coming Soon: Unified Notifications
          </CardTitle>
          <CardDescription>
            This approval system is designed to integrate seamlessly with our upcoming unified notification center
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">📧 Rich Email Notifications</h4>
              <p className="text-muted-foreground">
                Beautiful HTML emails with product images and one-click approve buttons
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">📱 Mobile Push Actions</h4>
              <p className="text-muted-foreground">
                Approve gifts directly from your phone's notification panel
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">🔔 Smart Grouping</h4>
              <p className="text-muted-foreground">
                All gift-related notifications organized in one place
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">⚡ Progressive Enhancement</h4>
              <p className="text-muted-foreground">
                Quick actions for trusted users, detailed review for others
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AutoGiftApprovals;