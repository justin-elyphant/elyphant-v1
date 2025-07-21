
import React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Shield } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { usePrivacySettings } from "@/hooks/usePrivacySettings";

const PrivacySettings: React.FC = () => {
  const { 
    settings, 
    loading,
    updateSettings
  } = usePrivacySettings();

  return (
    <>
      <Separator className="my-8" />
      
      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <div className="flex items-center mb-4">
          <Shield className="h-5 w-5 mr-2 text-muted-foreground" />
          <h3 className="text-lg font-medium">Privacy & Security Settings</h3>
        </div>
        
        <div className="space-y-6 mt-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Who can send connection requests</p>
                <p className="text-sm text-muted-foreground">Control who can send you connection requests</p>
              </div>
              <div className="w-[180px]">
                <Select 
                  value={settings.allow_connection_requests_from}
                  onValueChange={(value: 'everyone' | 'friends_only' | 'nobody') => 
                    updateSettings({ allow_connection_requests_from: value })
                  }
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="everyone">Everyone</SelectItem>
                    <SelectItem value="friends_only">Friends Only</SelectItem>
                    <SelectItem value="nobody">Nobody</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Profile visibility</p>
                <p className="text-sm text-muted-foreground">Control who can see your profile</p>
              </div>
              <div className="w-[180px]">
                <Select 
                  value={settings.profile_visibility}
                  onValueChange={(value: 'public' | 'followers_only' | 'private') => 
                    updateSettings({ profile_visibility: value })
                  }
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="followers_only">Followers Only</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Allow message requests</p>
                <p className="text-sm text-muted-foreground">Allow others to send you message requests</p>
              </div>
              <Switch 
                checked={settings.allow_message_requests}
                onCheckedChange={(checked) => 
                  updateSettings({ allow_message_requests: checked })
                }
                disabled={loading}
              />
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Show follower count</p>
                <p className="text-sm text-muted-foreground">Display your follower count on your profile</p>
              </div>
              <Switch 
                checked={settings.show_follower_count}
                onCheckedChange={(checked) => 
                  updateSettings({ show_follower_count: checked })
                }
                disabled={loading}
              />
            </div>

            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Show following count</p>
                <p className="text-sm text-muted-foreground">Display your following count on your profile</p>
              </div>
              <Switch 
                checked={settings.show_following_count}
                onCheckedChange={(checked) => 
                  updateSettings({ show_following_count: checked })
                }
                disabled={loading}
              />
            </div>

            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Block list visibility</p>
                <p className="text-sm text-muted-foreground">Control who can see your blocked users</p>
              </div>
              <div className="w-[180px]">
                <Select 
                  value={settings.block_list_visibility}
                  onValueChange={(value: 'hidden' | 'visible_to_friends') => 
                    updateSettings({ block_list_visibility: value })
                  }
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hidden">Hidden</SelectItem>
                    <SelectItem value="visible_to_friends">Visible to Friends</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PrivacySettings;
