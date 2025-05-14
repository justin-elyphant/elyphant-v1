
import React from 'react';
import { useProfile } from '@/contexts/profile/ProfileContext';
import { PrivacyLevel } from '@/utils/privacyUtils';
import PrivacyNotice from './PrivacyNotice';

interface ProfileInfoProps {
  isOwner: boolean;
  isFriend?: boolean;
}

const ProfileInfo: React.FC<ProfileInfoProps> = ({ isOwner, isFriend = false }) => {
  const { profile } = useProfile();
  
  if (!profile) return null;
  
  const privacySettings = profile.data_sharing_settings || {};
  
  // Helper to check if data should be displayed based on privacy setting
  const shouldDisplayData = (privacySetting: PrivacyLevel = 'private') => {
    if (isOwner) return true;
    
    switch (privacySetting) {
      case 'public': return true;
      case 'friends': return !!isFriend;
      default: return false;
    }
  };
  
  return (
    <div className="space-y-4">
      {/* Bio section */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h3 className="text-lg font-medium mb-2">Bio</h3>
        <p className="text-gray-600">{profile.bio || "No bio added yet"}</p>
      </div>
      
      {/* Email - only show if privacy allows */}
      {shouldDisplayData(privacySettings.email as PrivacyLevel) && (
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium mb-2 flex items-center">
            Email
            {!isOwner && <PrivacyNotice level={privacySettings.email as PrivacyLevel} />}
          </h3>
          <p className="text-gray-600">{profile.email}</p>
        </div>
      )}
      
      {/* Birthday - only show if privacy allows */}
      {profile.dob && shouldDisplayData(privacySettings.dob as PrivacyLevel) && (
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium mb-2 flex items-center">
            Birthday
            {!isOwner && <PrivacyNotice level={privacySettings.dob as PrivacyLevel} />}
          </h3>
          <p className="text-gray-600">
            {new Date(profile.dob).toLocaleDateString('en-US', { 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
      )}
      
      {/* Shipping address - only show if privacy allows */}
      {profile.shipping_address && shouldDisplayData(privacySettings.shipping_address as PrivacyLevel) && (
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium mb-2 flex items-center">
            Shipping Address
            {!isOwner && <PrivacyNotice level={privacySettings.shipping_address as PrivacyLevel} />}
          </h3>
          <p className="text-gray-600">
            {profile.shipping_address?.address_line1}
            {profile.shipping_address?.address_line2 && `, ${profile.shipping_address.address_line2}`}
            <br />
            {profile.shipping_address?.city}, {profile.shipping_address?.state} {profile.shipping_address?.zip_code}
            <br />
            {profile.shipping_address?.country}
          </p>
        </div>
      )}
    </div>
  );
};

export default ProfileInfo;
