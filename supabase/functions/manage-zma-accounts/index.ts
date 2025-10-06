// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, ...data } = await req.json();
    console.log(`🔧 Managing ZMA account: ${action}`);

    switch (action) {
      case 'create':
        const { account_name, api_key } = data;
        
        // Validate API key by checking balance
        const balanceCheck = await fetch('https://api.priceyak.com/v2/account/balance', {
          headers: {
            'Authorization': `Bearer ${api_key}`
          }
        });

        if (!balanceCheck.ok) {
          throw new Error('Invalid API key or account access');
        }

        const balanceData = await balanceCheck.json();
        
        // Set as default if no other accounts exist
        const { data: existingAccounts } = await supabase
          .from('zma_accounts')
          .select('id')
          .limit(1);

        const isDefault = !existingAccounts || existingAccounts.length === 0;

        const { data: newAccount, error: createError } = await supabase
          .from('zma_accounts')
          .insert({
            account_name,
            api_key,
            account_balance: balanceData.balance,
            last_balance_check: new Date().toISOString(),
            is_default: isDefault
          })
          .select()
          .single();

        if (createError) throw createError;

        console.log(`✅ Created ZMA account: ${account_name} (Balance: $${balanceData.balance})`);
        
        return new Response(
          JSON.stringify({
            success: true,
            account: newAccount,
            message: 'ZMA account created successfully'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'checkBalance':
        const { account_id } = data;
        
        let account;
        let accountError;
        
        // If no account_id provided, get the default account
        if (!account_id) {
          const { data: defaultAccount, error: defaultError } = await supabase
            .from('zma_accounts')
            .select('*')
            .eq('is_default', true)
            .single();
          
          account = defaultAccount;
          accountError = defaultError;
        } else {
          const { data: specificAccount, error: specificError } = await supabase
            .from('zma_accounts')
            .select('*')
            .eq('id', account_id)
            .single();
          
          account = specificAccount;
          accountError = specificError;
        }

        if (accountError || !account) {
          throw new Error('ZMA account not found. Please add a ZMA account first.');
        }

        const balanceResponse = await fetch('https://api.priceyak.com/v2/account/balance', {
          headers: {
            'Authorization': `Bearer ${account.api_key}`
          }
        });

        if (!balanceResponse.ok) {
          throw new Error('Failed to check balance');
        }

        const balance = await balanceResponse.json();

        // Update account balance
        await supabase
          .from('zma_accounts')
          .update({
            account_balance: balance.balance,
            last_balance_check: new Date().toISOString()
          })
          .eq('id', account_id);

        console.log(`💰 Balance check for ${account.account_name}: $${balance.balance}`);

        return new Response(
          JSON.stringify({
            success: true,
            balance: balance.balance,
            account_name: account.account_name,
            message: 'Balance updated successfully'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'list':
        const { data: accounts, error: listError } = await supabase
          .from('zma_accounts')
          .select('*')
          .order('created_at', { ascending: false });

        if (listError) throw listError;

        return new Response(
          JSON.stringify({
            success: true,
            accounts: accounts || [],
            message: 'ZMA accounts retrieved successfully'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'setDefault':
        const { account_id: defaultAccountId } = data;
        
        // Remove default from all accounts
        await supabase
          .from('zma_accounts')
          .update({ is_default: false })
          .neq('id', '00000000-0000-0000-0000-000000000000');

        // Set new default
        const { error: defaultError } = await supabase
          .from('zma_accounts')
          .update({ is_default: true })
          .eq('id', defaultAccountId);

        if (defaultError) throw defaultError;

        console.log(`🎯 Set default ZMA account: ${defaultAccountId}`);

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Default ZMA account updated'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error('❌ ZMA account management error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        message: 'Failed to manage ZMA account'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});