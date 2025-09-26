import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Database {
  public: {
    Functions: {
      cleanup_failed_orders: {
        Returns: number
      }
    }
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient<Database>(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    console.log('Starting order cleanup process...')

    // Call the cleanup function
    const { data: cleanupCount, error: cleanupError } = await supabaseClient
      .rpc('cleanup_failed_orders')

    if (cleanupError) {
      console.error('Error during cleanup:', cleanupError)
      throw cleanupError
    }

    console.log(`Cleanup completed. ${cleanupCount} orders marked as failed.`)

    // Also check for orders that need Zinc status sync
    const { data: pendingOrders, error: fetchError } = await supabaseClient
      .from('orders')
      .select('id, zinc_order_id, status, zinc_status')
      .not('zinc_order_id', 'is', null)
      .in('status', ['pending', 'processing'])
      .limit(50)

    if (fetchError) {
      console.error('Error fetching pending orders:', fetchError)
    } else if (pendingOrders && pendingOrders.length > 0) {
      console.log(`Found ${pendingOrders.length} orders that may need status sync`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Order cleanup completed successfully',
        ordersProcessed: cleanupCount,
        pendingOrdersForSync: pendingOrders?.length || 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Order cleanup failed:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})