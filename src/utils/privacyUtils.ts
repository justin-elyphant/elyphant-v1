
export type PrivacyLevel = 'private' | 'friends' | 'public';

export function getSharingLevelLabel(level: PrivacyLevel): string {
  switch (level) {
    case 'private':
      return 'Only you';
    case 'friends':
      return 'Friends only';
    case 'public':
      return 'Public';
    default:
      return 'Unknown';
  }
}

export function getDefaultDataSharingSettings() {
  return {
    dob: "private" as PrivacyLevel,
    shipping_address: "private" as PrivacyLevel,
    gift_preferences: "friends" as PrivacyLevel,
    email: "private" as PrivacyLevel
  };
}

export function getPrivacyLevelDescription(level: PrivacyLevel): string {
  switch (level) {
    case 'private':
      return 'Only you can see this information';
    case 'friends':
      return 'Only your connected friends can see this information';
    case 'public':
      return 'Anyone can see this information';
    default:
      return 'Unknown privacy setting';
  }
}
