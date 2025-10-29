
import React from "react";
import { Calendar, Gift, MapPin, Mail, Globe, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import PrivacyNotice from "./PrivacyNotice";
import { Profile } from "@/types/profile";
import { formatBirthdayForDisplay, shouldDisplayBirthday } from "@/utils/birthdayUtils";

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
    interests,
    data_sharing_settings
  } = profile;

  // Format birthday for display
  const formattedBirthday = formatBirthdayForDisplay(dob);
  const showBirthday = shouldDisplayBirthday(data_sharing_settings, 'public');

  // Format address for display
  const formatAddress = () => {
    if (!shipping_address) return null;
    const parts = [];
    if (shipping_address.city) parts.push(shipping_address.city);
    if (shipping_address.state) parts.push(shipping_address.state);
    if (shipping_address.country && shipping_address.country !== 'US') parts.push(shipping_address.country);
    return parts.join(', ');
  };

  const formattedAddress = formatAddress();

  return (
    <div className="space-y-4">
      {/* Contact Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Contact Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {email && data_sharing_settings?.email && data_sharing_settings.email !== 'private' && (
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
          {formattedBirthday && showBirthday && (
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                <Calendar className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">Birthday</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  {formattedBirthday}
                  <PrivacyNotice level={data_sharing_settings?.dob || 'private'} />
                </div>
              </div>
            </div>
          )}

          {formattedAddress && data_sharing_settings?.shipping_address && data_sharing_settings.shipping_address !== 'private' && (
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100">
                <MapPin className="h-4 w-4 text-orange-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">Location</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  {formattedAddress}
                  <PrivacyNotice level={data_sharing_settings.shipping_address} />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Interests - Show as gift preferences for UI */}
      {((interests && interests.length > 0) || (gift_preferences && gift_preferences.length > 0)) && 
       (data_sharing_settings?.interests || data_sharing_settings?.gift_preferences) && 
       (data_sharing_settings?.interests !== 'private' && data_sharing_settings?.gift_preferences !== 'private') && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Gift Preferences
              <PrivacyNotice level={data_sharing_settings.interests || data_sharing_settings.gift_preferences || 'private'} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* Show interests first (primary source from settings) */}
              {interests && Array.isArray(interests) && interests.slice(0, 6).map((interest, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm">{interest}</span>
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                </div>
              ))}
              
              {/* Fallback to gift_preferences if no interests */}
              {(!interests || interests.length === 0) && gift_preferences && Array.isArray(gift_preferences) && 
               gift_preferences.slice(0, 6).map((pref, i) => {
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
              
              {/* Show count of additional preferences */}
              {interests && interests.length > 6 && (
                <div className="text-xs text-muted-foreground pt-2">
                  +{interests.length - 6} more interests
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
