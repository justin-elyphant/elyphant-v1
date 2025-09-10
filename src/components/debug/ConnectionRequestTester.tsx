import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Debug component to test connection request functionality
 * Only visible in development mode
 */
const ConnectionRequestTester = () => {
  const { user } = useAuth();
  const [targetUserId, setTargetUserId] = useState('');
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const testConnectionRequest = async () => {
    if (!targetUserId.trim()) {
      toast.error('Please enter a target user ID');
      return;
    }

    setTesting(true);
    console.log('🧪 [ConnectionTester] Starting test with:', { currentUser: user?.id, targetUserId });

    try {
      // Step 1: Verify authentication
      const { data: authData, error: authError } = await supabase.auth.getUser();
      console.log('🧪 [ConnectionTester] Auth check:', { authData: authData.user?.id, authError });

      if (authError || !authData.user) {
        throw new Error(`Authentication failed: ${authError?.message || 'No user'}`);
      }

      // Step 2: Check target user exists
      const { data: targetProfile } = await supabase
        .from('profiles')
        .select('id, email, name')
        .eq('id', targetUserId)
        .single();

      console.log('🧪 [ConnectionTester] Target profile:', targetProfile);

      if (!targetProfile) {
        throw new Error('Target user not found');
      }

      // Step 3: Check for existing connection
      const { data: existingConnection } = await supabase
        .from('user_connections')
        .select('*')
        .or(`and(user_id.eq.${authData.user.id},connected_user_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},connected_user_id.eq.${authData.user.id})`)
        .maybeSingle();

      console.log('🧪 [ConnectionTester] Existing connection:', existingConnection);

      if (existingConnection) {
        throw new Error(`Connection already exists with status: ${existingConnection.status}`);
      }

      // Step 4: Test INSERT with full logging
      console.log('🧪 [ConnectionTester] Attempting INSERT...');
      
      const insertData = {
        user_id: authData.user.id,
        connected_user_id: targetUserId,
        relationship_type: 'friend',
        status: 'pending'
      };

      console.log('🧪 [ConnectionTester] Insert data:', insertData);

      const { data: insertResult, error: insertError } = await supabase
        .from('user_connections')
        .insert(insertData)
        .select()
        .single();

      console.log('🧪 [ConnectionTester] Insert result:', { insertResult, insertError });

      if (insertError) {
        throw new Error(`Insert failed: ${insertError.message} (Code: ${insertError.code})`);
      }

      // Step 5: Verify the record was created
      const { data: verification } = await supabase
        .from('user_connections')
        .select('*')
        .eq('id', insertResult.id)
        .single();

      console.log('🧪 [ConnectionTester] Verification:', verification);

      setResults(prev => [{
        timestamp: new Date().toISOString(),
        success: true,
        data: insertResult,
        verification
      }, ...prev]);

      toast.success('Connection request test successful!');

    } catch (error: any) {
      console.error('🧪 [ConnectionTester] Test failed:', error);
      
      setResults(prev => [{
        timestamp: new Date().toISOString(),
        success: false,
        error: error.message
      }, ...prev]);

      toast.error(`Test failed: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto m-4">
      <CardHeader>
        <CardTitle className="text-lg">🧪 Connection Request Debug Tester</CardTitle>
        <p className="text-sm text-muted-foreground">
          Test connection request functionality (Development only)
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-2">
          <Input
            placeholder="Target User ID (e.g., e43abe42-f289-47c4-a374-57202074d311)"
            value={targetUserId}
            onChange={(e) => setTargetUserId(e.target.value)}
            className="flex-1"
          />
          <Button onClick={testConnectionRequest} disabled={testing}>
            {testing ? 'Testing...' : 'Test Request'}
          </Button>
        </div>

        {user && (
          <div className="text-sm text-muted-foreground">
            Current user: {user.email} ({user.id})
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Test Results:</h4>
            {results.map((result, index) => (
              <div key={index} className="border rounded p-3 text-sm">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={result.success ? 'default' : 'destructive'}>
                    {result.success ? 'SUCCESS' : 'FAILED'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConnectionRequestTester;