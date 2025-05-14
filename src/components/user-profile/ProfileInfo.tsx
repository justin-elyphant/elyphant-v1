
import React from "react";
import { Calendar, Gift, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
    profile_image,
    bio,
    dob,
    shipping_address,
    gift_preferences,
    data_sharing_settings
  } = profile;

  const getInitials = (name?: string): string => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Card className="overflow-hidden">
      <div className="relative h-32 bg-gradient-to-r from-purple-500 to-indigo-500">
        {/* Background header */}
      </div>

      <div className="relative px-6 pb-6">
        <Avatar className="h-24 w-24 absolute -top-12 border-4 border-white bg-white">
          {profile_image ? (
            <AvatarImage src={profile_image} alt={name} />
          ) : (
            <AvatarFallback className="bg-purple-100 text-purple-600 text-xl">
              {getInitials(name)}
            </AvatarFallback>
          )}
        </Avatar>

        <div className="pt-14">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">{name}</h2>
              {username && <p className="text-sm text-muted-foreground">@{username}</p>}
            </div>
          </div>

          {bio && <p className="mt-4 text-sm text-gray-600">{bio}</p>}

          <Separator className="my-4" />

          <CardContent className="p-0 space-y-4">
            {/* Birthday section */}
            {dob && data_sharing_settings?.dob && (
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                  <Calendar className="h-4 w-4 text-purple-600" />
                </div>
                <div className="space-y-0.5">
                  <div className="text-sm">Birthday</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    {formatDate(dob)}
                    <PrivacyNotice level={data_sharing_settings.dob} />
                  </div>
                </div>
              </div>
            )}

            {/* Address section */}
            {shipping_address && data_sharing_settings?.shipping_address && (
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                  <MapPin className="h-4 w-4 text-purple-600" />
                </div>
                <div className="space-y-0.5">
                  <div className="text-sm">Address</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    {shipping_address.city}, {shipping_address.state}
                    <PrivacyNotice level={data_sharing_settings.shipping_address} />
                  </div>
                </div>
              </div>
            )}

            {/* Gift preferences section */}
            {gift_preferences && gift_preferences.length > 0 && data_sharing_settings?.gift_preferences && (
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                  <Gift className="h-4 w-4 text-purple-600" />
                </div>
                <div className="space-y-0.5">
                  <div className="text-sm">Gift Preferences</div>
                  <div className="text-xs text-muted-foreground">
                    <div className="flex flex-wrap gap-1 items-center">
                      {gift_preferences.slice(0, 3).map((pref, i) => (
                        <span 
                          key={i}
                          className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full"
                        >
                          {pref.category}
                        </span>
                      ))}
                      {gift_preferences.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{gift_preferences.length - 3} more
                        </span>
                      )}
                      <PrivacyNotice level={data_sharing_settings.gift_preferences} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </div>
      </div>
    </Card>
  );
};

export default ProfileInfo;
