import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Secure encryption functions using Web Crypto API
const ENCRYPTION_KEY_ENV = Deno.env.get('BUSINESS_PAYMENT_ENCRYPTION_KEY');
const FALLBACK_KEY = 'secure-business-payment-key-2024'; // Emergency fallback

const getEncryptionKey = (): string => {
  if (ENCRYPTION_KEY_ENV && ENCRYPTION_KEY_ENV.length >= 32) {
    return ENCRYPTION_KEY_ENV;
  }
  console.warn('SECURITY WARNING: Using fallback encryption key for business payments');
  return FALLBACK_KEY;
};

// Derive key from password using PBKDF2
const deriveKey = async (password: string, salt: Uint8Array): Promise<CryptoKey> => {
  const passwordBuffer = new TextEncoder().encode(password);
  const importedKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    importedKey,
    {
      name: 'AES-GCM',
      length: 256
    },
    false,
    ['encrypt', 'decrypt']
  );
};

// Encrypt data with AES-GCM
const encryptData = async (data: string): Promise<string> => {
  try {
    const encryptionPassword = getEncryptionKey();
    const dataBuffer = new TextEncoder().encode(data);
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const key = await deriveKey(encryptionPassword, salt);
    
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      dataBuffer
    );

    // Combine salt + iv + encrypted data
    const resultBuffer = new Uint8Array(
      16 + 12 + encryptedBuffer.byteLength
    );
    resultBuffer.set(salt, 0);
    resultBuffer.set(iv, 16);
    resultBuffer.set(new Uint8Array(encryptedBuffer), 28);

    // Return base64 encoded result
    return btoa(String.fromCharCode(...resultBuffer));
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt sensitive data');
  }
};

// Decrypt data with AES-GCM
const decryptData = async (encryptedData: string): Promise<string> => {
  try {
    const encryptionPassword = getEncryptionKey();
    
    // Decode from base64
    const encryptedBuffer = new Uint8Array(
      atob(encryptedData).split('').map(char => char.charCodeAt(0))
    );

    // Extract salt, iv, and encrypted data
    const salt = encryptedBuffer.slice(0, 16);
    const iv = encryptedBuffer.slice(16, 28);
    const data = encryptedBuffer.slice(28);

    const key = await deriveKey(encryptionPassword, salt);

    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      data
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt sensitive data');
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, paymentMethod } = await req.json();

    console.log(`Managing business payment method: ${action}`);

    switch (action) {
      case 'list':
        const { data: methods, error: listError } = await supabaseClient
          .from('business_payment_methods')
          .select('id, name, name_on_card, card_type, last_four, exp_month, exp_year, is_default, is_active, created_at')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (listError) throw listError;

        return new Response(JSON.stringify({ success: true, data: methods }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'add':
        // Validate required fields
        if (!paymentMethod.name || !paymentMethod.cardNumber || !paymentMethod.nameOnCard || 
            !paymentMethod.expMonth || !paymentMethod.expYear || !paymentMethod.cvv) {
          throw new Error('Missing required payment method fields');
        }

        // Get card type
        const cardNumber = paymentMethod.cardNumber.replace(/\s/g, '');
        let cardType = 'unknown';
        if (cardNumber.startsWith('4')) cardType = 'visa';
        else if (cardNumber.startsWith('5') || cardNumber.startsWith('2')) cardType = 'mastercard';
        else if (cardNumber.startsWith('3')) cardType = 'amex';
        else if (cardNumber.startsWith('6')) cardType = 'discover';

        const lastFour = cardNumber.slice(-4);

        // If this is being set as default, update other methods
        if (paymentMethod.isDefault) {
          await supabaseClient
            .from('business_payment_methods')
            .update({ is_default: false })
            .eq('is_default', true);
        }

        const { data: newMethod, error: addError } = await supabaseClient
          .from('business_payment_methods')
          .insert({
            name: paymentMethod.name,
            name_on_card: paymentMethod.nameOnCard,
            card_type: cardType,
            last_four: lastFour,
            exp_month: parseInt(paymentMethod.expMonth),
            exp_year: parseInt(paymentMethod.expYear),
            encrypted_number: await encryptData(cardNumber),
            encrypted_cvv: await encryptData(paymentMethod.cvv),
            is_default: paymentMethod.isDefault || false,
            is_active: true
          })
          .select('id, name, name_on_card, card_type, last_four, exp_month, exp_year, is_default, is_active, created_at')
          .single();

        if (addError) throw addError;

        console.log(`Added business payment method: ${newMethod.name}`);

        return new Response(JSON.stringify({ success: true, data: newMethod }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'setDefault':
        // First, unset all defaults
        await supabaseClient
          .from('business_payment_methods')
          .update({ is_default: false })
          .eq('is_default', true);

        // Set the new default
        const { error: defaultError } = await supabaseClient
          .from('business_payment_methods')
          .update({ is_default: true })
          .eq('id', paymentMethod.id);

        if (defaultError) throw defaultError;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'delete':
        const { error: deleteError } = await supabaseClient
          .from('business_payment_methods')
          .update({ is_active: false })
          .eq('id', paymentMethod.id);

        if (deleteError) throw deleteError;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'getDefault':
        const { data: defaultMethod, error: getDefaultError } = await supabaseClient
          .from('business_payment_methods')
          .select('*')
          .eq('is_default', true)
          .eq('is_active', true)
          .maybeSingle();

        if (getDefaultError) throw getDefaultError;

        if (defaultMethod) {
          // Decrypt the sensitive data for internal use
          defaultMethod.decrypted_number = await decryptData(defaultMethod.encrypted_number);
          defaultMethod.decrypted_cvv = await decryptData(defaultMethod.encrypted_cvv);
        }

        return new Response(JSON.stringify({ success: true, data: defaultMethod }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error('Error managing business payment method:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});