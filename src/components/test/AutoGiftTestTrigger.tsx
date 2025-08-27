import React from 'react';
import { Button } from "@/components/ui/button";
import { useAutoGiftTrigger } from "@/hooks/useAutoGiftTrigger";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const AutoGiftTestTrigger = () => {
  const { triggerAutoGiftProcessing, triggering } = useAutoGiftTrigger();
  const { user } = useAuth();

  const handleTrigger = async () => {
    if (!user?.id) return;
    
    try {
      // Call the process-auto-gifts function directly
      const { data, error } = await supabase.functions.invoke('process-auto-gifts', {
        body: { userId: user.id }
      });
      
      if (error) {
        console.error('❌ Error:', error);
        return;
      }
      
      console.log('✅ Processing result:', data);
    } catch (error) {
      console.error('❌ Error triggering:', error);
    }
  };

  const checkExecutionStatus = async () => {
    const { data, error } = await supabase
      .from('automated_gift_executions')
      .select('*')
      .eq('id', 'c60f3ea8-c1fd-4842-9d56-5f7b2035bdf3')
      .single();
    
    console.log('📊 Current execution status:', { data, error });
  };

  return (
    <div className="p-4 border rounded-lg bg-muted/50">
      <h3 className="font-semibold mb-4">Auto-Gift Test Controls</h3>
      <div className="space-y-2">
        <Button onClick={handleTrigger} disabled={triggering}>
          {triggering ? 'Processing...' : 'Trigger Auto-Gift Processing'}
        </Button>
        <Button variant="outline" onClick={checkExecutionStatus}>
          Check Execution Status
        </Button>
      </div>
    </div>
  );
};

export default AutoGiftTestTrigger;