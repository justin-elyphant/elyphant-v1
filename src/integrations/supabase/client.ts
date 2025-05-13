
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase.d';

// Create Supabase client with proper types
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or anon key is missing. Check your environment variables.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
