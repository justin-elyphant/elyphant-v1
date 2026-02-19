import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Shield, Eye, Users, MessageSquare, Heart, Gift, Lock, Sparkles } from "lucide-react";
import { usePrivacySettings } from "@/hooks/usePrivacySettings";
import { Separator } from "@/components/ui/separator";
import DeleteAccountSection from "./DeleteAccountSection";
import { SessionManagement } from "./SessionManagement";
import { ActiveSessionsCard } from "./ActiveSessionsCard";
import DataSharingSectionWrapper from "./DataSharingSectionWrapper";
import DataExportSection from "./DataExportSection";

const PrivacySharingSettings: React.FC = () => {
  const { settings, loading, updateSettings } = usePrivacySettings();

  return (
    <div className="space-y-6">
      {/* Data Sharing Section */}
      <DataSharingSectionWrapper />

      {/* Social Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Social Privacy
          </CardTitle>
          <CardDescription>
            Control who can interact with you and see your profile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Who can send connection requests
                </Label>
                <p className="text-sm text-muted-foreground">
                  Choose who can send you connection requests
                </p>
              </div>
              <Select
                value={settings.allow_connection_requests_from}
                onValueChange={(value: 'everyone' | 'connections_only' | 'nobody') =>
                  updateSettings({ allow_connection_requests_from: value })
                }
                disabled={loading}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="everyone">Everyone</SelectItem>
                  <SelectItem value="connections_only">My Connections Only</SelectItem>
                  <SelectItem value="nobody">Nobody</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Profile visibility
                </Label>
                <p className="text-sm text-muted-foreground">
                  Control who can see your profile
                </p>
              </div>
              <Select
                value={settings.profile_visibility}
                onValueChange={(value: 'public' | 'connections_only' | 'private') =>
                  updateSettings({ profile_visibility: value })
                }
                disabled={loading}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="connections_only">Connections Only</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Message requests
                </Label>
                <p className="text-sm text-muted-foreground">
                  Allow others to send you message requests
                </p>
              </div>
              <Switch
                checked={settings.allow_message_requests}
                onCheckedChange={(checked) =>
                  updateSettings({ allow_message_requests: checked })
                }
                disabled={loading}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Show connection count
                </Label>
                <p className="text-sm text-muted-foreground">
                  Display your connections count on your profile
                </p>
              </div>
              <Switch
                checked={settings.show_follower_count}
                onCheckedChange={(checked) =>
                  updateSettings({ show_follower_count: checked })
                }
                disabled={loading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gifting Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Gifting Privacy
          </CardTitle>
          <CardDescription>
            Control how others can interact with your gifting features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Who can see my wishlists
                </Label>
                <p className="text-sm text-muted-foreground">
                  Control who can browse your wishlist items
                </p>
              </div>
              <Select
                value={settings.wishlist_visibility}
                onValueChange={(value: 'public' | 'connections_only' | 'private') =>
                  updateSettings({ wishlist_visibility: value })
                }
                disabled={loading}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Everyone</SelectItem>
                  <SelectItem value="connections_only">Connections Only</SelectItem>
                  <SelectItem value="private">Only Me</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Who can set up auto-gifts for me
                </Label>
                <p className="text-sm text-muted-foreground">
                  Control who can create automatic gifts on your behalf
                </p>
              </div>
              <Select
                value={settings.auto_gift_consent}
                onValueChange={(value: 'everyone' | 'connections_only' | 'nobody') =>
                  updateSettings({ auto_gift_consent: value })
                }
                disabled={loading}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="everyone">Everyone</SelectItem>
                  <SelectItem value="connections_only">Connections Only</SelectItem>
                  <SelectItem value="nobody">Nobody</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Gift surprise mode
                </Label>
                <p className="text-sm text-muted-foreground">
                  Hide who purchased a gift until after the delivery date
                </p>
              </div>
              <Switch
                checked={settings.gift_surprise_mode}
                onCheckedChange={(checked) =>
                  updateSettings({ gift_surprise_mode: checked })
                }
                disabled={loading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Sessions Management */}
      <ActiveSessionsCard />

      {/* Session Management */}
      <SessionManagement />

      <Card>
        <CardHeader>
          <CardTitle>Block List Management</CardTitle>
          <CardDescription>
            Manage users you've blocked
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <a href="/settings/blocked-users">
              View Blocked Users
            </a>
          </Button>
        </CardContent>
      </Card>

      <DataExportSection />

      <DeleteAccountSection />
    </div>
  );
};

export default PrivacySharingSettings;
