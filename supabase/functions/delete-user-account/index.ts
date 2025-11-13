
// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Create regular client for user verification
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('Authentication failed:', authError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Deleting account for user:', user.id)

    // Call the database function to delete all user data
    const { data: deletionResult, error: deletionError } = await supabaseAdmin
      .rpc('delete_user_account', { target_user_id: user.id })

    if (deletionError) {
      console.error('Error deleting user data:', deletionError)
      return new Response(
        JSON.stringify({ error: 'Failed to delete user data', details: deletionError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('User data deleted successfully:', deletionResult)

    // Delete the user from auth.users table with retry logic
    let authDeleteError;
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second

    while (retryCount < maxRetries) {
      try {
        console.log(`Attempting to delete auth user (attempt ${retryCount + 1}/${maxRetries})`)
        const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id)
        
        if (!error) {
          console.log('Auth user deleted successfully')
          authDeleteError = null;
          break;
        }
        
        authDeleteError = error;
        console.error(`Auth deletion attempt ${retryCount + 1} failed:`, error)
        
        if (retryCount < maxRetries - 1) {
          console.log(`Waiting ${retryDelay}ms before retry...`)
          await new Promise(resolve => setTimeout(resolve, retryDelay))
        }
      } catch (error) {
        console.error(`Auth deletion attempt ${retryCount + 1} threw exception:`, error)
        authDeleteError = error;
        
        if (retryCount < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, retryDelay))
        }
      }
      
      retryCount++;
    }

    if (authDeleteError) {
      console.error('Failed to delete auth user after all retries:', authDeleteError)
      
      // Log detailed error information for debugging
      console.error('Auth deletion error details:', {
        name: authDeleteError.name,
        message: authDeleteError.message,
        status: authDeleteError.status,
        code: authDeleteError.code,
        stack: authDeleteError.stack
      })
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to delete user account from authentication system', 
          details: authDeleteError.message,
          retryCount: retryCount,
          debugInfo: {
            errorType: authDeleteError.name || 'Unknown',
            errorCode: authDeleteError.code || 'no_code',
            errorStatus: authDeleteError.status || 'no_status'
          }
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('User account deleted successfully from both database and auth')

    // Send account deletion confirmation email
    try {
      console.log('Sending account deletion confirmation email to:', user.email)
      const { data: emailResult, error: emailError } = await supabaseAdmin.functions.invoke('ecommerce-email-orchestrator', {
        body: {
          eventType: 'account_deletion_confirmation',
          recipientEmail: user.email,
          data: {
            first_name: user.user_metadata?.first_name || user.user_metadata?.firstName || 'there',
            email: user.email,
            deletion_timestamp: new Date().toISOString()
          }
        }
      })

      if (emailError) {
        console.error('Failed to send deletion confirmation email:', emailError)
        // Don't fail the deletion if email fails, just log it
      } else {
        console.log('Account deletion confirmation email sent successfully:', emailResult)
      }
    } catch (emailError) {
      console.error('Exception while sending deletion confirmation email:', emailError)
      // Don't fail the deletion if email fails, just log it
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Account deleted successfully',
        deletionSummary: deletionResult
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
