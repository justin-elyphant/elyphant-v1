
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
        .upsert(profile, { onConflict: 'id' });
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
