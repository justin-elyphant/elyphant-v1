
import { supabase } from "@/integrations/supabase/client";

export const createTestConnections = async (userId: string) => {
  console.log("Creating test connections for user:", userId);
  
  try {
    // Create test profiles first
    const testProfiles = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Alice Johnson',
        username: 'alice_j',
        email: 'alice@example.com',
        profile_image: '/placeholder.svg',
        bio: 'Love hiking and photography',
        interests: ['photography', 'hiking', 'travel']
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        name: 'Bob Smith',
        username: 'bob_smith',
        email: 'bob@example.com',
        profile_image: '/placeholder.svg',
        bio: 'Tech enthusiast and coffee lover',
        interests: ['technology', 'coffee', 'music']
      },
      {
        id: '33333333-3333-3333-3333-333333333333',
        name: 'Carol Davis',
        username: 'carol_d',
        email: 'carol@example.com',
        profile_image: '/placeholder.svg',
        bio: 'Artist and book lover',
        interests: ['art', 'books', 'movies']
      }
    ];

    // Insert test profiles (will only work if they don't exist)
    for (const profile of testProfiles) {
      await supabase
        .from('profiles')
        .upsert({
          ...profile,
          birth_year: 1990,
          first_name: profile.name.split(' ')[0] || 'Test',
          last_name: profile.name.split(' ')[1] || 'User'
        } as any, { onConflict: 'id' });
    }

    // Create test connections
    const testConnections = [
      {
        user_id: userId,
        connected_user_id: '11111111-1111-1111-1111-111111111111',
        relationship_type: 'friend',
        status: 'accepted'
      },
      {
        user_id: userId,
        connected_user_id: '22222222-2222-2222-2222-222222222222',
        relationship_type: 'friend',
        status: 'pending'
      },
      {
        user_id: '33333333-3333-3333-3333-333333333333',
        connected_user_id: userId,
        relationship_type: 'friend',
        status: 'pending'
      }
    ];

    // Insert test connections
    const { data, error } = await supabase
      .from('user_connections')
      .upsert(testConnections, { onConflict: 'id' });

    if (error) throw error;

    console.log("Test connections created successfully");
    return { success: true, data };
  } catch (error) {
    console.error("Error creating test connections:", error);
    return { success: false, error };
  }
};

export const cleanupTestData = async (userId: string) => {
  console.log("Cleaning up test data for user:", userId);
  
  try {
    // Remove test connections
    await supabase
      .from('user_connections')
      .delete()
      .or(`user_id.eq.${userId},connected_user_id.eq.${userId}`);

    // Remove test profiles
    const testProfileIds = [
      '11111111-1111-1111-1111-111111111111',
      '22222222-2222-2222-2222-222222222222',
      '33333333-3333-3333-3333-333333333333'
    ];

    await supabase
      .from('profiles')
      .delete()
      .in('id', testProfileIds);

    console.log("Test data cleaned up successfully");
    return { success: true };
  } catch (error) {
    console.error("Error cleaning up test data:", error);
    return { success: false, error };
  }
};

export const deletePendingConnection = async (userId: string, connectionName: string) => {
  console.log(`Deleting pending connection with ${connectionName} for user:`, userId);
  
  try {
    // Get the connection user ID by name
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .ilike('name', `%${connectionName}%`)
      .limit(1);

    if (!profiles || profiles.length === 0) {
      console.warn(`No profile found matching name: ${connectionName}`);
      return { success: false, error: 'Profile not found' };
    }

    const connectionUserId = profiles[0].id;

    // Delete the pending connection
    const { error } = await supabase
      .from('user_connections')
      .delete()
      .or(`user_id.eq.${userId},connected_user_id.eq.${userId}`)
      .or(`user_id.eq.${connectionUserId},connected_user_id.eq.${connectionUserId}`)
      .eq('status', 'pending');

    if (error) throw error;

    console.log(`✅ Pending connection with ${connectionName} deleted successfully`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting pending connection:", error);
    return { success: false, error };
  }
};

export const deleteAllPendingConnections = async (userId: string) => {
  console.log("Deleting all pending connections for user:", userId);
  
  try {
    const { error } = await supabase
      .from('user_connections')
      .delete()
      .or(`user_id.eq.${userId},connected_user_id.eq.${userId}`)
      .eq('status', 'pending');

    if (error) throw error;

    console.log("✅ All pending connections deleted successfully");
    return { success: true };
  } catch (error) {
    console.error("Error deleting pending connections:", error);
    return { success: false, error };
  }
};
