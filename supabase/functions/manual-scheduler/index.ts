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

    const { action, orderId, newDate, alertId } = await req.json()

    console.log(`🔧 [manual-scheduler] Manual action: ${action}`)

    switch (action) {
      case 'trigger_scheduled_processing':
        console.log('🚀 Manually triggering scheduled order processing...')
        
        const { data: triggerResult, error: triggerError } = await supabase.functions.invoke('process-scheduled-orders', {
          body: { manualTrigger: true }
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

      case 'get_processing_status':
        console.log('📊 Getting cron processing status...')
        
        const { data: cronLogs, error: cronError } = await supabase
          .from('cron_execution_logs')
          .select('*')
          .eq('cron_job_name', 'process-scheduled-orders-daily')
          .order('created_at', { ascending: false })
          .limit(10)

        const { data: alerts, error: alertsError } = await supabase
          .from('scheduled_order_alerts')
          .select('*')
          .eq('is_resolved', false)
          .order('created_at', { ascending: false })

        const { data: pendingOrders, error: ordersError } = await supabase
          .from('orders')
          .select('id, order_number, scheduled_delivery_date, status, created_at')
          .eq('status', 'scheduled')
          .order('scheduled_delivery_date', { ascending: true })

        return new Response(
          JSON.stringify({ 
            success: true,
            cronLogs: cronLogs || [],
            activeAlerts: alerts || [],
            pendingOrders: pendingOrders || [],
            summary: {
              recentExecutions: cronLogs?.length || 0,
              activeAlerts: alerts?.length || 0,
              pendingScheduledOrders: pendingOrders?.length || 0
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'resolve_alert':
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

      default:
        throw new Error(`Unknown action: ${action}`)
    }

  } catch (error) {
    console.error('❌ Error in manual-scheduler function:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})