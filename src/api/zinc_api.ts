import { supabase } from "@/integrations/supabase/client";
import { SUPABASE_FUNCTIONS } from '@/constants/supabaseFunctions';

export const testZincApiKey = async (apiKey: string) => {
    try {
      const { data, error } = await supabase.functions.invoke(SUPABASE_FUNCTIONS.TEST_ZINC_API_KEY, {
        body: {
          api_key: apiKey
        }
      });
      if (error) {
        return null;
      }
      return true;
    } catch(e) {
      console.log('Test Zinc Api Key failed: ', e);
      return null;
    }
}

export const updateZincApiKey = async (id: string | null, key: string) => {
    try {
        if(!id) {
            const {data, error} = await supabase.from('api_keys').insert({key: key}).select().single();
            if (error) {
                throw new Error('Error updating API key: ' + error.message);
            } else {
                return true;
            }
        }
        else {
            const {data, error} = await supabase.from('api_keys').update({key: key}).eq('id', id).select().single();
            if (error) {
                throw new Error('Error updating API key: ' + error.message);
            }
            else {
                return true;
            }
        }
    } catch(e) {
        console.log(e);
        return null;
    }
}

export const getZincApiKey = async () => {{
    try {
        const { data, error } = await supabase.from('api_keys')
        .select('*')
        .limit(1)
        .single();
        if(error) {
            throw new Error('Error fetching API key: ' + error.message);
        }
        console.log(data);
        return data;
    } catch(e) {
        console.log(e);
        return null;
    }
}}
