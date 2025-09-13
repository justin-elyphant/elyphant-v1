import { supabase } from "@/integrations/supabase/client";

export interface AuthDebugInfo {
  hasSession: boolean;
  hasUser: boolean;
  hasToken: boolean;
  userId?: string;
  email?: string;
  tokenExpiry?: string;
  sessionValid: boolean;
  dbAuthTest: boolean;
  rpcTestResult?: any;
}

export interface RLSDebugResult {
  canRead: boolean;
  canInsert: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  errors: string[];
  warnings: string[];
}

export const authDebugService = {
  /**
   * Comprehensive authentication debugging
   */
  async debugAuthentication(): Promise<AuthDebugInfo> {
    console.log('🔍 [AUTH_DEBUG] Starting comprehensive auth debugging...');
    
    const debug: AuthDebugInfo = {
      hasSession: false,
      hasUser: false,
      hasToken: false,
      sessionValid: false,
      dbAuthTest: false
    };
    
    try {
      // Test 1: Check session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      debug.hasSession = !!session;
      debug.hasUser = !!session?.user;
      debug.hasToken = !!session?.access_token;
      
      if (session?.user) {
        debug.userId = session.user.id;
        debug.email = session.user.email;
        debug.tokenExpiry = session.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'never';
      }
      
      debug.sessionValid = !sessionError && !!session?.user?.id;
      
      console.log('✅ [AUTH_DEBUG] Session check:', {
        hasSession: debug.hasSession,
        hasUser: debug.hasUser,
        hasToken: debug.hasToken,
        sessionValid: debug.sessionValid,
        error: sessionError?.message
      });
      
      // Test 2: Database auth context test
      if (debug.sessionValid && session?.user?.id) {
        try {
          console.log('🧪 [AUTH_DEBUG] Testing database auth context...');
          
          const { data: profileTest, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', session.user.id)
            .maybeSingle();
            
          debug.dbAuthTest = !profileError;
          
          console.log('✅ [AUTH_DEBUG] DB auth test:', {
            success: debug.dbAuthTest,
            userExists: !!profileTest,
            error: profileError?.message
          });
          
          // Test 3: RPC function call to verify auth context
          try {
            const { data: rpcData, error: rpcError } = await supabase.rpc('can_view_profile', {
              profile_user_id: session.user.id
            });
            
            debug.rpcTestResult = { success: !rpcError, result: rpcData, error: rpcError?.message };
            
            console.log('✅ [AUTH_DEBUG] RPC auth test:', debug.rpcTestResult);
            
          } catch (rpcError) {
            console.warn('⚠️ [AUTH_DEBUG] RPC test failed:', rpcError);
            debug.rpcTestResult = { success: false, error: 'RPC call failed' };
          }
          
        } catch (dbError: any) {
          console.error('💥 [AUTH_DEBUG] DB auth test failed:', dbError);
          debug.dbAuthTest = false;
        }
      }
      
    } catch (error: any) {
      console.error('💥 [AUTH_DEBUG] Critical auth debugging error:', error);
    }
    
    return debug;
  },

  /**
   * Test RLS policies for a specific table
   */
  async debugRLSPolicies(tableName: string, userId?: string): Promise<RLSDebugResult> {
    console.log(`🛡️ [RLS_DEBUG] Testing RLS policies for table: ${tableName}`);
    
    const result: RLSDebugResult = {
      canRead: false,
      canInsert: false,
      canUpdate: false,
      canDelete: false,
      errors: [],
      warnings: []
    };
    
    const testUserId = userId || (await supabase.auth.getUser()).data.user?.id;
    
    if (!testUserId) {
      result.errors.push('No user ID available for RLS testing');
      return result;
    }
    
    // Test READ permission
    try {
      const { error: readError } = await supabase
        .from(tableName as any)
        .select('*')
        .limit(1);
        
      result.canRead = !readError;
      if (readError) {
        result.errors.push(`READ: ${readError.message}`);
      }
    } catch (error: any) {
      result.errors.push(`READ: ${error.message}`);
    }
    
    // Test INSERT permission (dry run with invalid data to test policy only)
    try {
      const { error: insertError } = await supabase
        .from(tableName as any)
        .insert({ user_id: testUserId, test_field: 'rls_test' } as any);
        
      // Even if insert fails due to missing columns, if it's not an RLS error, policies allow insert
      result.canInsert = !insertError || !insertError.message.includes('policy');
      
      if (insertError && insertError.message.includes('policy')) {
        result.errors.push(`INSERT: ${insertError.message}`);
      } else if (insertError) {
        result.warnings.push(`INSERT: Schema error (RLS OK): ${insertError.message}`);
      }
    } catch (error: any) {
      if (error.message.includes('policy')) {
        result.errors.push(`INSERT: ${error.message}`);
      } else {
        result.warnings.push(`INSERT: Schema error (RLS OK): ${error.message}`);
      }
    }
    
    console.log(`✅ [RLS_DEBUG] Completed RLS test for ${tableName}:`, result);
    return result;
  },

  /**
   * Force session refresh and validate
   */
  async refreshAndValidateSession(): Promise<{ success: boolean; error?: string }> {
    console.log('🔄 [AUTH_DEBUG] Forcing session refresh...');
    
    try {
      const { error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('💥 [AUTH_DEBUG] Session refresh failed:', error);
        return { success: false, error: error.message };
      }
      
      // Validate the refreshed session
      const authInfo = await this.debugAuthentication();
      
      console.log('✅ [AUTH_DEBUG] Session refresh complete:', {
        success: authInfo.sessionValid && authInfo.dbAuthTest
      });
      
      return {
        success: authInfo.sessionValid && authInfo.dbAuthTest,
        error: authInfo.sessionValid ? undefined : 'Session invalid after refresh'
      };
      
    } catch (error: any) {
      console.error('💥 [AUTH_DEBUG] Session refresh failed:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Comprehensive auth and RLS diagnosis for user_connections table
   */
  async diagnoseUserConnectionsIssue(): Promise<{
    authValid: boolean;
    rlsStatus: RLSDebugResult;
    recommendations: string[];
  }> {
    console.log('🏥 [DIAGNOSIS] Starting comprehensive user_connections diagnosis...');
    
    const recommendations: string[] = [];
    
    // Step 1: Check authentication
    const authInfo = await this.debugAuthentication();
    
    if (!authInfo.sessionValid) {
      recommendations.push('Session is invalid - user needs to sign in again');
    }
    
    if (!authInfo.dbAuthTest) {
      recommendations.push('Database authentication context is broken - session refresh needed');
    }
    
    // Step 2: Test RLS policies
    const rlsStatus = await this.debugRLSPolicies('user_connections');
    
    if (!rlsStatus.canInsert) {
      recommendations.push('INSERT policy is blocking - check RLS policies for user_connections table');
    }
    
    if (rlsStatus.errors.length > 0) {
      recommendations.push('RLS policy errors detected - review Row Level Security configuration');
    }
    
    // Step 3: Check for common issues
    if (authInfo.tokenExpiry) {
      const expiry = new Date(authInfo.tokenExpiry);
      const now = new Date();
      const timeToExpiry = expiry.getTime() - now.getTime();
      
      if (timeToExpiry < 300000) { // Less than 5 minutes
        recommendations.push('Auth token expires soon - refresh session preemptively');
      }
    }
    
    console.log('🏥 [DIAGNOSIS] Diagnosis complete:', {
      authValid: authInfo.sessionValid && authInfo.dbAuthTest,
      rlsIssues: rlsStatus.errors.length,
      recommendations: recommendations.length
    });
    
    return {
      authValid: authInfo.sessionValid && authInfo.dbAuthTest,
      rlsStatus,
      recommendations
    };
  }
};