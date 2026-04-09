
import React from "react";
import { Calendar, Gift, Globe, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PrivacyIndicator from "./PrivacyIndicator";
import { Profile } from "@/types/profile";
import { formatBirthdayForDisplay, shouldDisplayBirthday } from "@/utils/birthdayUtils";
import { FieldVisibility } from "@/hooks/usePrivacySettings";

interface ProfileInfoProps {
  profile: Profile;
  /** Field visibility from privacy_settings table */
  privacySettings?: {
    dob_visibility?: string;
    interests_visibility?: string;
    shipping_address_visibility?: string;
    email_visibility?: string;
  };
  /** Viewer's relationship to this profile owner */
  viewerRelationship?: 'self' | 'friend' | 'public';
}

const ProfileInfo: React.FC<ProfileInfoProps> = ({ profile, privacySettings, viewerRelationship = 'public' }) => {
  const {
    name,
    username,
    bio,
    dob,
    shipping_address,
    gift_preferences,
    interests,
  } = profile;

  // Use privacy_settings table values (fallback to legacy data_sharing_settings for transition)
  const dobVisibility = (privacySettings?.dob_visibility || profile.data_sharing_settings?.dob || 'private') as FieldVisibility;
  const interestsVisibility = (privacySettings?.interests_visibility || profile.data_sharing_settings?.interests || 'public') as FieldVisibility;

  const formattedBirthday = formatBirthdayForDisplay(dob);
  const showBirthday = shouldDisplayBirthday(dobVisibility, viewerRelationship);

  // Determine if interests should be shown based on visibility and viewer relationship
  const showInterests = (() => {
    if (viewerRelationship === 'self') return true;
    if (interestsVisibility === 'public') return true;
    if (interestsVisibility === 'friends' && viewerRelationship === 'friend') return true;
    return false;
  })();

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
      {username && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Contact Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                <Globe className="h-4 w-4 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">Username</div>
                <div className="text-xs text-muted-foreground">@{username}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
                  <PrivacyIndicator level={dobVisibility} />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {((interests && interests.length > 0) || (gift_preferences && gift_preferences.length > 0)) && 
       showInterests && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Gift Preferences
              <PrivacyIndicator level={interestsVisibility} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {interests && Array.isArray(interests) && interests.slice(0, 6).map((interest, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm">{interest}</span>
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                </div>
              ))}
              
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
              
              {interests && interests.length > 6 && (
                <div className="text-xs text-muted-foreground pt-2">
                  +{interests.length - 6} more interests
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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
