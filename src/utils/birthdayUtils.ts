
import { parseBirthdayFromStorage } from "./dataFormatUtils";
import { FieldVisibility } from "@/hooks/usePrivacySettings";

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
 * Checks if birthday should be displayed based on privacy settings.
 * Accepts a FieldVisibility value directly from the privacy_settings table.
 */
export const shouldDisplayBirthday = (
  visibility: FieldVisibility,
  viewerRelationship: 'self' | 'friend' | 'public' = 'public'
): boolean => {
  switch (visibility) {
    case 'private':
      return viewerRelationship === 'self';
    case 'friends':
      return viewerRelationship === 'self' || viewerRelationship === 'friend';
    case 'public':
      return true;
    default:
      return false;
  }
};
