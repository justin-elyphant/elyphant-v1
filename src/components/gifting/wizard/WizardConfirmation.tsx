import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Mail, Calendar, Gift, DollarSign, MapPin, User } from "lucide-react";
import { GiftSetupData } from "../GiftSetupWizard";

interface WizardConfirmationProps {
  data: GiftSetupData;
  onClose: () => void;
}

export const WizardConfirmation: React.FC<WizardConfirmationProps> = ({ data, onClose }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getEventDisplayName = (event: any) => {
    if (event.dateType === 'custom' && event.customName) {
      return event.customName;
    }
    return event.dateType.charAt(0).toUpperCase() + event.dateType.slice(1).replace('_', ' ');
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-green-700">Gift Setup Complete!</h2>
          <p className="text-muted-foreground">
            Everything is ready for {data.recipientName}. Here's what we've set up:
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {/* Recipient Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5" />
              Recipient Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">{data.recipientName}</span>
              <Badge variant="secondary">{data.relationshipType.replace('_', ' ')}</Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              {data.recipientEmail}
            </div>
            {data.shippingAddress && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                Address saved for delivery
              </div>
            )}
          </CardContent>
        </Card>

        {/* Events */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5" />
              Gift Occasions ({data.giftingEvents.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.giftingEvents.map((event, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">{getEventDisplayName(event)}</p>
                  <p className="text-sm text-muted-foreground">{formatDate(event.date)}</p>
                </div>
                <div className="flex gap-2">
                  {event.isRecurring && (
                    <Badge variant="outline">Annual</Badge>
                  )}
                  {data.autoGiftingEnabled && (
                    <Badge variant="default">Auto-Gift</Badge>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Gift Settings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Gift className="h-5 w-5" />
              Gift Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Auto-Gifting</span>
              <Badge variant={data.autoGiftingEnabled ? "default" : "secondary"}>
                {data.autoGiftingEnabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Scheduled Reminders</span>
              <Badge variant={data.scheduledGiftingEnabled ? "default" : "secondary"}>
                {data.scheduledGiftingEnabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>

            {data.autoGiftingEnabled && data.budgetLimit && (
              <div className="flex items-center justify-between">
                <span>Budget per Gift</span>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  <span>${data.budgetLimit}</span>
                </div>
              </div>
            )}

            {data.giftCategories.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Preferred Categories:</p>
                <div className="flex flex-wrap gap-1">
                  {data.giftCategories.slice(0, 3).map((category, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {category}
                    </Badge>
                  ))}
                  {data.giftCategories.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{data.giftCategories.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Next Steps */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-primary">What happens next?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <Mail className="h-4 w-4 mt-0.5 text-primary" />
            <span>We'll send an invitation email to {data.recipientName} to join the platform</span>
          </div>
          <div className="flex items-start gap-2">
            <Gift className="h-4 w-4 mt-0.5 text-primary" />
            <span>Once they join, you'll be connected and gift automation will be active</span>
          </div>
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 mt-0.5 text-primary" />
            <span>You'll receive notifications before each occasion as configured</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center pt-4">
        <Button onClick={onClose} size="lg">
          Done
        </Button>
      </div>
    </div>
  );
};