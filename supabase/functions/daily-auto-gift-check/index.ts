
// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🕐 Daily auto-gift check started - Enhanced with security tracking')

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Phase 1: Log execution start
    const executionStartTime = Date.now()
    const executionId = crypto.randomUUID()
    
    console.log(`📊 Execution ID: ${executionId} - Starting daily check with enhanced monitoring`)

    // Phase 2: Call the main auto-gift processing function with tracking
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/process-auto-gifts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        'Content-Type': 'application/json',
        'X-Execution-ID': executionId
      },
      body: JSON.stringify({
        executionId,
        scheduledExecution: true,
        timestamp: new Date().toISOString()
      })
    })

    const result = await response.json()
    const executionTime = Date.now() - executionStartTime
    
    // Phase 3: Enhanced logging with execution metrics
    console.log(`Daily auto-gift check completed in ${executionTime}ms:`, {
      executionId,
      executionTime,
      success: response.ok,
      result
    })

    // Phase 4: Log execution completion for audit trail
    if (response.ok) {
      console.log(`✅ Daily execution ${executionId} completed successfully`)
    } else {
      console.error(`❌ Daily execution ${executionId} failed:`, result)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Daily auto-gift check completed with enhanced tracking',
        executionId,
        executionTime,
        result
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Daily auto-gift check error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
