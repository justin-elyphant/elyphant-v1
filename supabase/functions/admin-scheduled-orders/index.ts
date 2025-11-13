// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, orderId, newDate } = await req.json()

    console.log(`🔧 [admin-scheduled-orders] Admin action: ${action}`)

    switch (action) {
      case 'get_status':
        console.log('📊 Getting scheduled order processing status...')
        
        // Get cron execution logs
        const { data: cronLogs, error: cronError } = await supabase
          .from('cron_execution_logs')
          .select('*')
          .eq('cron_job_name', 'process-scheduled-orders-daily')
          .order('created_at', { ascending: false })
          .limit(10)

        // Get active alerts
        const { data: alerts, error: alertsError } = await supabase
          .from('scheduled_order_alerts')
          .select('*')
          .eq('is_resolved', false)
          .order('created_at', { ascending: false })

        // Get pending scheduled orders
        const { data: pendingOrders, error: ordersError } = await supabase
          .from('orders')
          .select('id, order_number, scheduled_delivery_date, status, created_at, updated_at')
          .eq('status', 'scheduled')
          .order('scheduled_delivery_date', { ascending: true })

        // Get orders ready for processing (scheduled for 4+ days from now)
        const { data: readyOrders, error: readyError } = await supabase
          .from('orders')
          .select('id, order_number, scheduled_delivery_date, status, created_at')
          .eq('status', 'scheduled')
          .lte('scheduled_delivery_date', new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
          .order('scheduled_delivery_date', { ascending: true })

        return new Response(
          JSON.stringify({ 
            success: true,
            data: {
              cronLogs: cronLogs || [],
              activeAlerts: alerts || [],
              pendingOrders: pendingOrders || [],
              readyForProcessing: readyOrders || [],
              summary: {
                recentExecutions: cronLogs?.length || 0,
                activeAlerts: alerts?.length || 0,
                pendingScheduledOrders: pendingOrders?.length || 0,
                readyForProcessing: readyOrders?.length || 0,
                nextCronRun: '14:00 UTC daily'
              }
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'trigger_processing':
        console.log('🚀 Manually triggering scheduled order processing...')
        
        const { data: triggerResult, error: triggerError } = await supabase.functions.invoke('process-scheduled-orders', {
          body: { manualTrigger: true, triggeredBy: 'admin' }
        })

        if (triggerError) {
          throw new Error(`Failed to trigger scheduled processing: ${triggerError.message}`)
        }

        return new Response(
          JSON.stringify({ 
            success: true,
            message: 'Scheduled processing triggered manually',
            result: triggerResult
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'update_order_date':
        if (!orderId || !newDate) {
          throw new Error('orderId and newDate are required for date updates')
        }

        console.log(`📅 Updating order ${orderId} delivery date to ${newDate}`)
        
        const { data: order, error: fetchError } = await supabase
          .from('orders')
          .select('order_number, scheduled_delivery_date, status')
          .eq('id', orderId)
          .single()

        if (fetchError || !order) {
          throw new Error(`Order not found: ${orderId}`)
        }

        const { error: updateError } = await supabase
          .from('orders')
          .update({
            scheduled_delivery_date: newDate,
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId)

        if (updateError) {
          throw new Error(`Failed to update order date: ${updateError.message}`)
        }

        return new Response(
          JSON.stringify({ 
            success: true,
            message: `Order ${order.order_number} delivery date updated to ${newDate}`,
            orderId,
            oldDate: order.scheduled_delivery_date,
            newDate
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'resolve_alert':
        const { alertId } = await req.json()
        
        if (!alertId) {
          throw new Error('alertId is required')
        }

        const { error: resolveError } = await supabase
          .from('scheduled_order_alerts')
          .update({
            is_resolved: true,
            resolved_at: new Date().toISOString()
          })
          .eq('id', alertId)

        if (resolveError) {
          throw new Error(`Failed to resolve alert: ${resolveError.message}`)
        }

        return new Response(
          JSON.stringify({ 
            success: true,
            message: `Alert ${alertId} resolved`
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'check_missed_orders':
        console.log('🔍 Checking for missed scheduled orders...')
        
        // Trigger the database function to check for missed orders
        const { error: checkError } = await supabase.rpc('check_missed_scheduled_orders')
        
        if (checkError) {
          throw new Error(`Failed to check missed orders: ${checkError.message}`)
        }

        return new Response(
          JSON.stringify({ 
            success: true,
            message: 'Missed order check completed'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      default:
        throw new Error(`Unknown action: ${action}`)
    }

  } catch (error) {
    console.error('❌ Error in admin-scheduled-orders function:', error)
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