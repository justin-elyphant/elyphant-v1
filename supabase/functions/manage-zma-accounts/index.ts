import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ZINC_API_TOKEN = Deno.env.get('ZINC_API_TOKEN');
    if (!ZINC_API_TOKEN) {
      throw new Error('ZINC_API_TOKEN not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = btoa(`${ZINC_API_TOKEN}:`);

    // Fetch balance from Zinc API
    console.log('[manage-zma-accounts] Fetching ZMA balance from Zinc...');
    const balanceResponse = await fetch('https://api.zinc.io/v1/addax/balance', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/json',
      },
    });

    if (!balanceResponse.ok) {
      const errorText = await balanceResponse.text();
      console.error('[manage-zma-accounts] Balance API error:', errorText);
      throw new Error(`Zinc balance API error: ${balanceResponse.status} - ${errorText}`);
    }

    const balanceData = await balanceResponse.json();
    console.log('[manage-zma-accounts] Balance data:', balanceData);

    // Fetch recent transactions from Zinc API
    console.log('[manage-zma-accounts] Fetching ZMA transactions from Zinc...');
    const transactionsResponse = await fetch('https://api.zinc.io/v1/addax/transactions?limit=20', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/json',
      },
    });

    let transactions: any[] = [];
    if (transactionsResponse.ok) {
      const transactionsData = await transactionsResponse.json();
      transactions = transactionsData.transactions || transactionsData || [];
      console.log('[manage-zma-accounts] Transactions count:', transactions.length);
    } else {
      console.warn('[manage-zma-accounts] Could not fetch transactions:', transactionsResponse.status);
    }

    // Extract balance values - Zinc returns balance in cents
    const balanceInCents = balanceData.balance || balanceData.available_balance || 0;
    const balanceInDollars = balanceInCents / 100;
    const pendingCharges = (balanceData.pending_charges || 0) / 100;
    const availableFunds = (balanceData.available_balance || balanceInCents) / 100;

    // Update zma_accounts table with fresh balance
    const { data: existingAccount, error: fetchError } = await supabase
      .from('zma_accounts')
      .select('*')
      .limit(1)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('[manage-zma-accounts] Error fetching existing account:', fetchError);
    }

    const now = new Date().toISOString();
    
    if (existingAccount) {
      // Update existing account
      const { error: updateError } = await supabase
        .from('zma_accounts')
        .update({
          account_balance: balanceInDollars,
          last_balance_check: now,
          updated_at: now,
        })
        .eq('id', existingAccount.id);

      if (updateError) {
        console.error('[manage-zma-accounts] Error updating account:', updateError);
      }
    } else {
      // Insert new account record
      const { error: insertError } = await supabase
        .from('zma_accounts')
        .insert({
          account_name: 'Primary ZMA Account',
          account_balance: balanceInDollars,
          account_status: 'active',
          last_balance_check: now,
          is_default: true,
        });

      if (insertError) {
        console.error('[manage-zma-accounts] Error inserting account:', insertError);
      }
    }

    // Log balance check in audit log
    await supabase
      .from('zma_balance_audit_log')
      .insert({
        update_source: 'api_sync',
        previous_balance: existingAccount?.account_balance || 0,
        new_balance: balanceInDollars,
        notes: 'Automated balance check via manage-zma-accounts function',
        account_id: existingAccount?.id,
      });

    return new Response(
      JSON.stringify({
        success: true,
        balance: balanceInDollars,
        available_funds: availableFunds,
        pending_charges: pendingCharges,
        last_checked_at: now,
        recent_transactions: transactions.slice(0, 10),
        raw_balance_data: balanceData,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('[manage-zma-accounts] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
