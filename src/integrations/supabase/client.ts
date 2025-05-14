
import { createClient } from '@supabase/supabase-js';

// Create Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Add fallback values for development
const fallbackUrl = 'https://dmkxtkvlispxeqfzlczr.supabase.co';
const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRta3h0a3ZsaXNweGVxZnpsY3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3ODYwNTYsImV4cCI6MjA1OTM2MjA1Nn0.L4maWmbU_MgnjWRuc9hGZweXVY4QCYjrnhFMGbdEebI';

const url = supabaseUrl || fallbackUrl;
const key = supabaseAnonKey || fallbackKey;

console.log('Initializing Supabase client with URL:', url);

// Check if we have the required values
if (!url || !key) {
  console.error('Missing Supabase URL or anon key. Check your environment variables.');
}

export const supabase = createClient(url, key);
