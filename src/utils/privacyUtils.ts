
import { SharingLevel } from "@/types/supabase";
import { ConnectionStatus } from "@/hooks/useConnectionStatus";

/**
 * Determines whether specific user data should be visible based on privacy settings
 * and connection status between users
 * 
 * @param data The data to check visibility for
 * @param privacySetting The privacy setting for this data type ('public', 'friends', 'private')
 * @param connectionStatus The connection status between viewer and data owner
 * @returns Boolean indicating if the data should be visible
 */
export const isDataVisible = (
  data: any, 
  privacySetting: SharingLevel = 'private',
  connectionStatus: ConnectionStatus = 'none'
): boolean => {
  // If data doesn't exist, it's not visible regardless of settings
  if (data === null || data === undefined) return false;
  
  // Public data is always visible
  if (privacySetting === 'public') return true;
  
  // Friends-only data is visible only to connected users with 'accepted' status
  if (privacySetting === 'friends' && connectionStatus === 'accepted') return true;
  
  // Private data is never visible to others
  return false;
};

/**
 * Gets the default sharing level for a specific data type
 * 
 * @param dataType The type of data ('dob', 'shipping_address', 'gift_preferences', etc.)
 * @returns The default sharing level for this data type
 */
export const getDefaultSharingLevel = (dataType: string): SharingLevel => {
  switch (dataType) {
    case 'dob':
      return 'friends';
    case 'shipping_address':
      return 'friends';
    case 'gift_preferences':
      return 'public';
    case 'email':
      return 'private';
    default:
      return 'private';
  }
};

/**
 * Creates default data sharing settings object with sensible defaults
 * 
 * @returns A complete data sharing settings object with default values
 */
export const getDefaultDataSharingSettings = () => {
  return {
    dob: getDefaultSharingLevel('dob'),
    shipping_address: getDefaultSharingLevel('shipping_address'),
    gift_preferences: getDefaultSharingLevel('gift_preferences'),
    email: getDefaultSharingLevel('email')
  };
};

/**
 * Determines whether the current user should see another user's data
 * based on connection status and privacy settings
 * 
 * @param viewerUserId The ID of the user viewing the data
 * @param ownerUserId The ID of the user who owns the data
 * @param dataSharingSettings The owner's data sharing settings
 * @param dataType The type of data being accessed
 * @param connectionStatus The connection status between viewer and owner
 * @returns Boolean indicating if the data should be visible
 */
export const shouldSeeUserData = (
  viewerUserId: string | undefined,
  ownerUserId: string | undefined,
  dataSharingSettings: any,
  dataType: string,
  connectionStatus: ConnectionStatus = 'none'
): boolean => {
  // Users can always see their own data
  if (viewerUserId && ownerUserId && viewerUserId === ownerUserId) {
    return true;
  }
  
  if (!viewerUserId || !ownerUserId || !dataSharingSettings) {
    return false;
  }
  
  const privacySetting = dataSharingSettings[dataType] || getDefaultSharingLevel(dataType);
  
  // Public data is visible to everyone
  if (privacySetting === 'public') {
    return true;
  }
  
  // For friends-only data, check if users are connected with 'accepted' status
  if (privacySetting === 'friends') {
    return connectionStatus === 'accepted';
  }
  
  // Private data is never visible to others
  return false;
};
