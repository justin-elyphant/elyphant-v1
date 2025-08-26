// Manual trigger test for auto-gift processing
import { supabase } from "@/integrations/supabase/client";

async function testManualTrigger() {
  console.log('🚀 Triggering manual auto-gift processing...');
  
  try {
    const { data, error } = await supabase.functions.invoke('process-auto-gifts', {
      body: {}
    });

    if (error) {
      console.error('❌ Error triggering auto-gift processing:', error);
      return;
    }

    console.log('✅ Auto-gift processing triggered successfully:', data);
    
    // Check for execution records
    const { data: executions, error: executionError } = await supabase
      .from('automated_gift_executions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (executionError) {
      console.error('❌ Error fetching executions:', executionError);
    } else {
      console.log('📊 Recent executions:', executions);
    }

  } catch (err) {
    console.error('❌ Exception during trigger:', err);
  }
}

// Run the test
testManualTrigger();