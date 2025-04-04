
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dmkxtkvlispxeqfzlczr.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRta3h0a3ZsaXNweGVxZnpsY3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTI0MjI5MDIsImV4cCI6MjAyNzk5ODkwMn0.c6tdQyCmPH79laAyEVCunDiQAcgXZLYRXMSx6qCXUTk';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
