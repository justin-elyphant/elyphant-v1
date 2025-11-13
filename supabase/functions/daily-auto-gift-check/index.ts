
// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
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

    // Parse request body for optional user filter
    const body = await req.json().catch(() => ({}));
    const { userId } = body || {};

    if (userId) {
      console.log(`🎯 Running targeted check for user: ${userId}`);
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Phase 1: Log execution start
    const executionStartTime = Date.now()
    const executionId = crypto.randomUUID()
    
    console.log(`📊 Execution ID: ${executionId} - Starting daily check with enhanced monitoring`)

    // Phase 1: Create pending executions from upcoming events (7 days ahead)
    console.log('🔍 Phase 1: Checking for upcoming events requiring executions...')
    
    const { data: upcomingEvents, error: eventsError } = await supabaseClient
      .rpc('get_upcoming_auto_gift_events', { 
        days_ahead: 7,
        user_filter: userId || null
      })
    
    if (eventsError) {
      console.error('❌ Failed to fetch upcoming events:', eventsError)
    } else if (upcomingEvents && upcomingEvents.length > 0) {
      console.log(`📅 Found ${upcomingEvents.length} upcoming auto-gift events`)
      
      let createdCount = 0
      let skippedCount = 0
      
      // Create executions for each matched event
      for (const event of upcomingEvents) {
        // Calculate execution date (7 days before event)
        const eventDate = new Date(event.event_date)
        const executionDate = new Date(eventDate)
        executionDate.setDate(executionDate.getDate() - 7)
        const executionDateStr = executionDate.toISOString().split('T')[0]
        
        // Check for existing execution to prevent duplicates
        const { data: existing } = await supabaseClient
          .from('automated_gift_executions')
          .select('id')
          .eq('rule_id', event.rule_id)
          .eq('event_id', event.event_id)
          .eq('execution_date', executionDateStr)
          .maybeSingle()
        
        if (!existing) {
          // Create new execution
          const { data: newExecution, error: createError } = await supabaseClient
            .from('automated_gift_executions')
            .insert({
              user_id: event.user_id,
              rule_id: event.rule_id,
              event_id: event.event_id,
              execution_date: executionDateStr,
              status: 'pending',
              ai_agent_source: {
                agent: 'system_scheduler',
                data_sources: [],
                confidence_score: 100,
                discovery_method: 'scheduled_event_match'
              }
            })
            .select()
            .single()
          
          if (createError) {
            console.error(`❌ Failed to create execution for event ${event.event_id}:`, createError)
          } else {
            console.log(`✅ Created execution ${newExecution.id} for ${event.event_type} on ${event.event_date}`)
            createdCount++
          }
        } else {
          console.log(`⏭️ Execution already exists for event ${event.event_id}, skipping`)
          skippedCount++
        }
      }
      
      console.log(`📊 Execution creation summary: ${createdCount} created, ${skippedCount} skipped`)
    } else {
      console.log('📭 No upcoming auto-gift events found')
    }

    // Phase 2: Call the main auto-gift processing function with tracking
    console.log('🔄 Phase 2: Processing pending executions...')
    
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
