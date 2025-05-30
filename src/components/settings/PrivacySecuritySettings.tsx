import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Shield, Eye, Users, MessageSquare, Heart } from "lucide-react";
import { usePrivacySettings } from "@/hooks/usePrivacySettings";
import { Separator } from "@/components/ui/separator";
import DeleteAccountSection from "./DeleteAccountSection";

const PrivacySecuritySettings: React.FC = () => {
  const { settings, loading, updateSettings } = usePrivacySettings();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy Settings
          </CardTitle>
          <CardDescription>
            Control who can interact with you and see your information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Who can follow you
                </Label>
                <p className="text-sm text-muted-foreground">
                  Choose who can follow your profile
                </p>
              </div>
              <Select
                value={settings.allow_follows_from}
                onValueChange={(value: 'everyone' | 'friends_only' | 'nobody') => 
                  updateSettings({ allow_follows_from: value })
                }
                disabled={loading}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="everyone">Everyone</SelectItem>
                  <SelectItem value="friends_only">Friends Only</SelectItem>
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
                onValueChange={(value: 'public' | 'followers_only' | 'private') => 
                  updateSettings({ profile_visibility: value })
                }
                disabled={loading}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="followers_only">Followers Only</SelectItem>
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
                  Show follower count
                </Label>
                <p className="text-sm text-muted-foreground">
                  Display your follower count on your profile
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

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Show following count
                </Label>
                <p className="text-sm text-muted-foreground">
                  Display your following count on your profile
                </p>
              </div>
              <Switch
                checked={settings.show_following_count}
                onCheckedChange={(checked) => 
                  updateSettings({ show_following_count: checked })
                }
                disabled={loading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

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

      <DeleteAccountSection />
    </div>
  );
};

export default PrivacySecuritySettings;
