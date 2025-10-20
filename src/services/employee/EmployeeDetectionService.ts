import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface EmployeeDetectionResult {
  isEmployee: boolean;
  reason: 'email-domain' | 'profile-type' | 'both' | 'none';
  profileType?: string;
}

export class EmployeeDetectionService {
  /**
   * Determines if a user is an Elyphant employee using secure role-based check
   */
  static async detectEmployee(user: User | null): Promise<EmployeeDetectionResult> {
    if (!user?.email) {
      return { isEmployee: false, reason: 'none' };
    }

    try {
      // Check employee role using secure has_role function
      const { data: hasEmployeeRole, error } = await supabase
        .rpc('has_role', { 
          _user_id: user.id, 
          _role: 'employee' 
        });

      if (error) {
        console.error('Employee detection error:', error);
        return { isEmployee: false, reason: 'none' };
      }

      if (hasEmployeeRole) {
        const isElyphantEmail = user.email.endsWith('@elyphant.com');
        return { 
          isEmployee: true, 
          reason: isElyphantEmail ? 'both' : 'profile-type',
          profileType: 'employee' 
        };
      }

      return { isEmployee: false, reason: 'none' };
    } catch (error) {
      console.error('Employee detection: Unexpected error', error);
      return { isEmployee: false, reason: 'none' };
    }
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