/**
 * Utility functions to help migrate and ensure profile data consistency
 * between onboarding and settings views
 */

import { supabase } from "@/integrations/supabase/client";

/**
 * Ensures all profiles have the required fields populated
 * This helps fix any existing profiles that might be missing first_name, last_name, or birth_year
 */
export async function ensureProfileDataConsistency(userId: string) {
  try {
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (fetchError || !profile) {
      console.error('Error fetching profile for consistency check:', fetchError);
      return;
    }

    const updates: any = {};
    let needsUpdate = false;

    // Ensure first_name and last_name are populated from name field
    if (!profile.first_name || !profile.last_name) {
      if (profile.name) {
        const nameParts = profile.name.split(' ');
        if (!profile.first_name) {
          updates.first_name = nameParts[0] || '';
          needsUpdate = true;
        }
        if (!profile.last_name) {
          updates.last_name = nameParts.slice(1).join(' ') || '';
          needsUpdate = true;
        }
      }
    }

    // Ensure birth_year is populated
    if (!profile.birth_year) {
      if (profile.dob) {
        // Try to extract year from dob if it's a full date
        try {
          const dobDate = new Date(profile.dob);
          if (!isNaN(dobDate.getTime())) {
            updates.birth_year = dobDate.getFullYear();
            needsUpdate = true;
          }
        } catch (e) {
          // If dob is just MM-DD format, use default age
          updates.birth_year = new Date().getFullYear() - 25;
          needsUpdate = true;
        }
      } else {
        // Default birth year if no dob available
        updates.birth_year = new Date().getFullYear() - 25;
        needsUpdate = true;
      }
    }

    // Apply updates if needed
    if (needsUpdate) {
      console.log('Updating profile for consistency:', updates);
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating profile for consistency:', updateError);
      } else {
        console.log('Profile consistency update successful');
      }
    }
  } catch (error) {
    console.error('Error in profile consistency check:', error);
  }
}

/**
 * Validates that a profile has all required mandatory fields
 */
export function validateProfileCompleteness(profile: any): {
  isComplete: boolean;
  missingFields: string[];
} {
  const requiredFields = [
    'first_name',
    'last_name', 
    'email',
    'username',
    'birth_year'
  ];

  const missingFields = requiredFields.filter(field => 
    !profile[field] || (typeof profile[field] === 'string' && profile[field].trim() === '')
  );

  return {
    isComplete: missingFields.length === 0,
    missingFields
  };
}