import { supabase } from "@/integrations/supabase/client";

// Legacy Zinc API test function - no longer available
// Use admin-order-tools edge function for testing instead
export const testZincApiKey = async (apiKey: string) => {
  console.warn('testZincApiKey is deprecated - Zinc API testing moved to admin-order-tools');
  return null;
};

export const updateZincApiKey = async (id: string | null, key: string) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        if(!id) {
            const {data, error} = await supabase.from('api_keys').insert({
                key: key,
                user_id: user.id
            }).select().single();
            if (error) {
                throw new Error('Error updating API key: ' + error.message);
            } else {
                return true;
            }
        }
        else {
            const {data, error} = await supabase.from('api_keys').update({key: key}).eq('id', parseInt(id)).select().single();
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
