
import { parseBirthdayFromStorage } from "./dataFormatUtils";

/**
 * Formats birthday for display on profile pages
 */
export const formatBirthdayForDisplay = (dob: string | null, birth_year?: number | null): string | null => {
  if (!dob) return null;
  
  const birthday = parseBirthdayFromStorage(dob, birth_year);
  if (!birthday) return null;
  
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  const monthName = months[birthday.getMonth()];
  return `${monthName} ${birthday.getDate()}`;
};

/**
 * Checks if birthday should be displayed based on privacy settings
 */
export const shouldDisplayBirthday = (
  dataSharingSettings: any,
  viewerRelationship: 'self' | 'friend' | 'public' = 'public'
): boolean => {
  if (!dataSharingSettings?.dob) return false;
  
  const privacyLevel = dataSharingSettings.dob;
  
  switch (privacyLevel) {
    case 'private':
      return viewerRelationship === 'self';
    case 'friends':
    case 'connections': // normalize both terms
      return viewerRelationship === 'self' || viewerRelationship === 'friend';
    case 'public':
      return true;
    default:
      return false;
  }
};
