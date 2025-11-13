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
    console.log('📅 Updating scheduled order delivery date for testing...')

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json()
    const { orderId, newDeliveryDate } = body

    if (!orderId || !newDeliveryDate) {
      throw new Error('Order ID and new delivery date are required')
    }

    console.log(`📅 Updating order ${orderId} delivery date to ${newDeliveryDate}`)

    // Update the order's scheduled delivery date
    const { data: updateResult, error: updateError } = await supabase
      .from('orders')
      .update({
        scheduled_delivery_date: newDeliveryDate,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()

    if (updateError) {
      console.error('❌ Failed to update delivery date:', updateError)
      throw updateError
    }

    console.log('✅ Successfully updated delivery date:', updateResult)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Updated delivery date to ${newDeliveryDate}`,
        orderId,
        newDeliveryDate,
        updatedOrder: updateResult
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ Error updating scheduled order date:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})