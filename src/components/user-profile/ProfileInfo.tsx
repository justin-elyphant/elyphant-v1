
import React from "react";
import { CalendarClock, Mail, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { isFieldVisible } from "@/utils/privacyUtils";
import { Profile } from "@/types/profile";
import { format } from "date-fns";

interface ProfileInfoProps {
  profile: Profile;
  isFriend?: boolean;
  isCurrentUser?: boolean;
}

const ProfileInfo: React.FC<ProfileInfoProps> = ({ 
  profile, 
  isFriend = false, 
  isCurrentUser = false 
}) => {
  const dataSharingSettings = profile.data_sharing_settings || {
    email: 'private',
    dob: 'private',
    shipping_address: 'private',
    gift_preferences: 'friends'
  };
  
  // Check if fields should be visible based on sharing settings
  const showEmail = isFieldVisible(dataSharingSettings.email, isFriend, isCurrentUser);
  const showBirthday = isFieldVisible(dataSharingSettings.dob, isFriend, isCurrentUser);
  const showAddress = isFieldVisible(dataSharingSettings.shipping_address, isFriend, isCurrentUser);

  const getBirthday = () => {
    const birthday = profile.important_dates?.find(date => 
      date.description.toLowerCase().includes('birthday')
    );
    return birthday ? format(new Date(birthday.date), 'MMMM d') : null;
  };

  return (
    <div className="space-y-4">
      {/* Bio */}
      {profile.bio && (
        <div>
          <p className="text-sm text-muted-foreground">{profile.bio}</p>
        </div>
      )}
      
      {/* Contact & Location Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {/* Email */}
        {profile.email && showEmail && (
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{profile.email}</span>
          </div>
        )}
        
        {/* Birthday */}
        {getBirthday() && showBirthday && (
          <div className="flex items-center gap-2 text-sm">
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
            <span>Birthday: {getBirthday()}</span>
          </div>
        )}
        
        {/* Address */}
        {profile.address && showAddress && profile.address.city && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>
              {profile.address.city}, {profile.address.state}
            </span>
          </div>
        )}
      </div>
      
      {/* Interests */}
      {profile.interests && profile.interests.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">Interests</h4>
          <div className="flex flex-wrap gap-2">
            {profile.interests.map((interest, index) => (
              <Badge key={index} variant="secondary">
                {interest}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileInfo;
