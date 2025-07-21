
import { useProfile } from "@/contexts/profile/ProfileContext";
import { createBirthdayImportantDate, hasBirthdayInImportantDates, mapApiDatesToFormFormat } from "./profileDataMapper";

/**
 * Checks if a profile needs birthday migration (has dob but no birthday in important_dates)
 */
export function profileNeedsBirthdayMigration(profile: any): boolean {
  if (!profile || !profile.dob) return false;
  
  const existingImportantDates = mapApiDatesToFormFormat(profile.important_dates);
  return !hasBirthdayInImportantDates(existingImportantDates);
}

/**
 * Creates the birthday migration data for a profile
 */
export function createBirthdayMigrationData(profile: any) {
  if (!profile || !profile.dob) return null;
  
  const birthdayImportantDate = createBirthdayImportantDate(profile.dob, profile.birth_year);
  if (!birthdayImportantDate) return null;
  
  // Convert to API format
  const birthdayApiFormat = {
    title: "Birthday",
    date: birthdayImportantDate.date.toISOString(),
    type: "custom",
    description: "Birthday"
  };
  
  // Add to existing important_dates
  const existingDates = Array.isArray(profile.important_dates) ? profile.important_dates : [];
  
  return {
    important_dates: [birthdayApiFormat, ...existingDates]
  };
}

/**
 * Hook to automatically migrate birthday data for the current user
 */
export function useBirthdayMigration() {
  const { profile, updateProfile } = useProfile();
  
  const migrateBirthday = async () => {
    if (!profile || !profileNeedsBirthdayMigration(profile)) {
      console.log("🎂 No birthday migration needed");
      return false;
    }
    
    console.log("🎂 Migrating birthday to important dates for profile:", profile.id);
    
    try {
      const migrationData = createBirthdayMigrationData(profile);
      if (!migrationData) {
        console.error("❌ Failed to create birthday migration data");
        return false;
      }
      
      await updateProfile(migrationData);
      console.log("✅ Birthday migration completed successfully");
      return true;
    } catch (error) {
      console.error("❌ Birthday migration failed:", error);
      return false;
    }
  };
  
  return {
    needsMigration: profileNeedsBirthdayMigration(profile),
    migrateBirthday
  };
}
