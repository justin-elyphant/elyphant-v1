import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface EmployeeDetectionResult {
  isEmployee: boolean;
  reason: 'email-domain' | 'profile-type' | 'both' | 'none';
  profileType?: string;
}

export class EmployeeDetectionService {
  /**
   * Determines if a user is an Elyphant employee based on email domain and/or profile type
   */
  static async detectEmployee(user: User | null): Promise<EmployeeDetectionResult> {
    if (!user?.email) {
      return { isEmployee: false, reason: 'none' };
    }

    const isElyphantEmail = user.email.endsWith('@elyphant.com');
    
    // Quick check - if email domain matches, likely an employee
    if (isElyphantEmail) {
      // Also check database profile type for confirmation
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('profile_type')
          .eq('id', user.id)
          .single();

        const isEmployeeProfile = profile?.profile_type === 'employee';
        
        if (isEmployeeProfile) {
          return { 
            isEmployee: true, 
            reason: 'both',
            profileType: profile.profile_type 
          };
        } else {
          return { 
            isEmployee: true, 
            reason: 'email-domain',
            profileType: profile?.profile_type 
          };
        }
      } catch (error) {
        console.warn('Employee detection: Could not fetch profile, using email domain only');
        return { isEmployee: true, reason: 'email-domain' };
      }
    }

    // Check if profile type indicates employee (fallback)
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('profile_type')
        .eq('id', user.id)
        .single();

      if (profile?.profile_type === 'employee') {
        return { 
          isEmployee: true, 
          reason: 'profile-type',
          profileType: profile.profile_type 
        };
      }
    } catch (error) {
      console.warn('Employee detection: Could not fetch profile for non-elyphant email');
    }

    return { isEmployee: false, reason: 'none' };
  }

  /**
   * Gets the appropriate default route for a user based on employee status
   */
  static getDefaultRoute(isEmployee: boolean): string {
    return isEmployee ? '/trunkline' : '/dashboard';
  }

  /**
   * Gets the appropriate redirect path for a user after login
   * Employees get access to Trunkline + consumer features (additive permissions)
   */
  static getPostLoginRoute(isEmployee: boolean, intendedPath?: string): string {
    // If user has an intended path and it's not employee-only, respect it
    if (intendedPath && !this.isEmployeeOnlyPath(intendedPath)) {
      return intendedPath;
    }
    
    return this.getDefaultRoute(isEmployee);
  }

  /**
   * Checks if a path is employee-only and should redirect consumers
   */
  static isEmployeeOnlyPath(path: string): boolean {
    return path.startsWith('/trunkline') && path !== '/trunkline-login';
  }
}