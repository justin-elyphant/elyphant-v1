
// Define data sharing settings types
export type DataSharingLevel = 'none' | 'minimal' | 'standard' | 'extensive' | 'full';

export interface DataSharingSettings {
  sharing_level: DataSharingLevel;
  allow_marketing: boolean;
  allow_wishlist_suggestions: boolean;
  allow_event_reminders: boolean;
  allow_friend_recommendations: boolean;
  allow_data_analysis: boolean;
}

/**
 * Get default data sharing settings for new users
 */
export const getDefaultDataSharingSettings = (): DataSharingSettings => ({
  sharing_level: 'standard',
  allow_marketing: false,
  allow_wishlist_suggestions: true,
  allow_event_reminders: true,
  allow_friend_recommendations: true,
  allow_data_analysis: false
});

/**
 * Get a human-readable label for a sharing level
 */
export const getSharingLevelLabel = (level: DataSharingLevel): string => {
  const labels: Record<DataSharingLevel, string> = {
    none: 'No Sharing',
    minimal: 'Minimal',
    standard: 'Standard',
    extensive: 'Extensive',
    full: 'Full Access'
  };
  return labels[level] || 'Unknown';
};

/**
 * Check if data should be visible based on privacy settings
 */
export const isDataVisible = (
  field: string,
  sharingLevel: DataSharingLevel,
  isOwner: boolean = false
): boolean => {
  if (isOwner) return true;
  
  // Fields visible at different sharing levels
  const visibilityMap: Record<DataSharingLevel, string[]> = {
    none: [],
    minimal: ['name', 'username', 'avatar_url'],
    standard: ['name', 'username', 'avatar_url', 'bio', 'interests'],
    extensive: ['name', 'username', 'avatar_url', 'bio', 'interests', 'birthday', 'special_dates'],
    full: ['name', 'username', 'avatar_url', 'bio', 'interests', 'birthday', 'special_dates', 'address', 'email', 'phone']
  };
  
  return visibilityMap[sharingLevel]?.includes(field) || false;
};
