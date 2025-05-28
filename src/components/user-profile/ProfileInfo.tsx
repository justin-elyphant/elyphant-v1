
import React from "react";
import { Calendar, Gift, MapPin, Mail, Globe, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import PrivacyNotice from "./PrivacyNotice";
import { formatDate } from "@/utils/date-formatting";
import { Profile } from "@/types/profile";

interface ProfileInfoProps {
  profile: Profile;
}

const ProfileInfo: React.FC<ProfileInfoProps> = ({ profile }) => {
  const {
    name,
    username,
    email,
    bio,
    dob,
    shipping_address,
    gift_preferences,
    data_sharing_settings
  } = profile;

  return (
    <div className="space-y-4">
      {/* Contact Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Contact Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {email && data_sharing_settings?.email && (
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                <Mail className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">Email</div>
                <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                  {email}
                  <PrivacyNotice level={data_sharing_settings.email} />
                </div>
              </div>
            </div>
          )}

          {username && (
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                <Globe className="h-4 w-4 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">Username</div>
                <div className="text-xs text-muted-foreground">@{username}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Personal Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {dob && data_sharing_settings?.dob && (
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                <Calendar className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">Birthday</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  {formatDate(dob)}
                  <PrivacyNotice level={data_sharing_settings.dob} />
                </div>
              </div>
            </div>
          )}

          {shipping_address && data_sharing_settings?.shipping_address && (
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100">
                <MapPin className="h-4 w-4 text-orange-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">Location</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  {shipping_address.city}, {shipping_address.state}
                  <PrivacyNotice level={data_sharing_settings.shipping_address} />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gift Preferences */}
      {gift_preferences && gift_preferences.length > 0 && data_sharing_settings?.gift_preferences && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Gift Preferences
              <PrivacyNotice level={data_sharing_settings.gift_preferences} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {gift_preferences.slice(0, 6).map((pref, i) => {
                const category = typeof pref === 'string' ? pref : pref.category;
                const importance = typeof pref === 'object' ? pref.importance : 'medium';
                
                return (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm">{category}</span>
                    <div className={`w-2 h-2 rounded-full ${
                      importance === 'high' ? 'bg-red-500' :
                      importance === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />
                  </div>
                );
              })}
              {gift_preferences.length > 6 && (
                <div className="text-xs text-muted-foreground pt-2">
                  +{gift_preferences.length - 6} more preferences
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Privacy Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-muted-foreground">
            This user controls what information is visible to you based on your connection level.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileInfo;
