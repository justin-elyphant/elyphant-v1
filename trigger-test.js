// Test the auto-gift processing workflow
import { supabase } from "@/integrations/supabase/client";

async function triggerAutoGiftTest() {
  console.log('🚀 Starting auto-gift processing test...');
  
  try {
    // Trigger the process-auto-gifts edge function
    const { data, error } = await supabase.functions.invoke('process-auto-gifts', {
      body: {}
    });

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    console.log('✅ Processing result:', data);
    
    // Wait a moment then check execution status
    setTimeout(async () => {
      const { data: execution } = await supabase
        .from('automated_gift_executions')
        .select('*')
        .eq('id', 'c60f3ea8-c1fd-4842-9d56-5f7b2035bdf3')
        .single();
      
      console.log('📊 Updated execution:', execution);
    }, 2000);

  } catch (err) {
    console.error('❌ Exception:', err);
  }
}

// Run the test
triggerAutoGiftTest();