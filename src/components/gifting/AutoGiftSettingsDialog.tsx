import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, DollarSign, Bell, Gift, Shield } from "lucide-react";
import BudgetTrackingSection from "./events/automated-tab/BudgetTrackingSection";
import NotificationSettingsSection from "./events/automated-tab/NotificationSettingsSection";
import DefaultGiftSourceSection from "./events/automated-tab/DefaultGiftSourceSection";
import PaymentHealthSection from "./auto-gift/PaymentHealthSection";
import { useAutoGifting } from "@/hooks/useAutoGifting";

interface AutoGiftSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AutoGiftSettingsDialog: React.FC<AutoGiftSettingsDialogProps> = ({
  open,
  onOpenChange
}) => {
  const { settings, updateSettings } = useAutoGifting();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Auto-Gifting Settings
          </DialogTitle>
          <DialogDescription>
            Configure your default preferences for automated gift-giving
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="budget" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="budget" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Budget
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="sources" className="flex items-center gap-2">
              <Gift className="h-4 w-4" />
              Gift Sources
            </TabsTrigger>
            <TabsTrigger value="payment-health" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Payment Health
            </TabsTrigger>
          </TabsList>

          <TabsContent value="budget" className="mt-6">
            <BudgetTrackingSection 
              settings={settings}
              onUpdateSettings={updateSettings}
            />
          </TabsContent>

          <TabsContent value="notifications" className="mt-6">
            <NotificationSettingsSection 
              settings={settings}
              onUpdateSettings={updateSettings}
            />
          </TabsContent>

          <TabsContent value="sources" className="mt-6">
            <div className="p-4 border rounded-lg">
              <DefaultGiftSourceSection 
                settings={settings}
                onUpdateSettings={updateSettings}
              />
            </div>
          </TabsContent>

          <TabsContent value="payment-health" className="mt-6">
            <PaymentHealthSection 
              settings={settings}
              onUpdateSettings={updateSettings}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};