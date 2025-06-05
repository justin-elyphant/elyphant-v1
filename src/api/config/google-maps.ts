
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the API key from Supabase secrets
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase not configured, Google Maps API key not available');
      return res.status(200).json({ apiKey: null });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // In a real implementation, you would fetch from Supabase secrets
    // For now, we'll use the environment variable approach
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.warn('Google Maps API key not found in environment');
      return res.status(200).json({ apiKey: null });
    }

    res.status(200).json({ apiKey });
  } catch (error) {
    console.error('Error fetching Google Maps API key:', error);
    res.status(200).json({ apiKey: null });
  }
}
