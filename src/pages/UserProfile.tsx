
import React from "react";
import { useParams, Link } from "react-router-dom";
import ProfileInfo from "@/components/user-profile/ProfileInfo";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import MainLayout from "@/components/layout/MainLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/types/profile";
import { Loader } from "lucide-react";

const UserProfile = () => {
  const { userId } = useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isMockProfile, setIsMockProfile] = useState<boolean>(false);
  
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!userId) {
          setError("User ID is required");
          return;
        }
        
        // Check if this is a mock ID (like "mock-1", "mock-2", etc.)
        if (userId.startsWith('mock-')) {
          // Create a mock profile for demo purposes
          const mockName = userId === 'mock-1' ? 'Alex Johnson' : 
                          userId === 'mock-2' ? 'Jamie Smith' :
                          userId === 'mock-3' ? 'Taylor Wilson' :
                          userId === 'mock-4' ? 'Jordan Parks' :
                          userId === 'mock-5' ? 'Casey Morgan' :
                          userId === 'mock-6' ? 'Sam Chen' :
                          `User ${userId}`;
          
          const mockProfile: Profile = {
            id: userId,
            name: mockName,
            email: `${mockName.toLowerCase().replace(' ', '.')}@example.com`,
            profile_image: null,
            bio: `This is a demo profile for ${mockName}. This user is part of your messaging connections.`,
            dob: null,
            shipping_address: null,
            gift_preferences: [],
            important_dates: [],
            data_sharing_settings: {
              dob: 'private',
              shipping_address: 'private',
              gift_preferences: 'friends',
              email: 'private'
            },
            username: mockName.toLowerCase().replace(' ', '_'),
            recently_viewed: [],
            interests: ['technology', 'books', 'travel'],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          setProfile(mockProfile);
          setIsMockProfile(true);
          return;
        }
        
        // Try to fetch real profile from database
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();
          
        if (error) throw error;
        
        if (data) {
          setProfile(data as Profile);
        } else {
          setError("User not found");
        }
      } catch (err: any) {
        console.error("Error fetching user profile:", err);
        setError(err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [userId]);
  
  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }
  
  if (error || !profile) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <h2 className="text-xl font-bold text-red-500">
            {error || "Profile not found"}
          </h2>
          <Button asChild>
            <Link to="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h1 className="text-2xl font-bold">
            {profile.name || profile.username || "User Profile"}
            {isMockProfile && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                (Demo Profile)
              </span>
            )}
          </h1>
          <div className="flex items-center gap-2">
            <Button variant="outline">Connect</Button>
            <Button asChild>
              <Link to={`/messages/${userId}`}>Message</Link>
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <ProfileInfo profile={profile} />
          </div>
          
          <div className="md:col-span-2">
            <Tabs defaultValue="wishlists">
              <TabsList className="w-full">
                <TabsTrigger value="wishlists" className="flex-1">Wishlists</TabsTrigger>
                <TabsTrigger value="events" className="flex-1">Events</TabsTrigger>
                <TabsTrigger value="activity" className="flex-1">Activity</TabsTrigger>
              </TabsList>
              
              <TabsContent value="wishlists" className="mt-4">
                <Card className="p-4">
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {isMockProfile 
                      ? "This is a demo profile. Wishlists are not available for demo users."
                      : "No public wishlists to display"
                    }
                  </p>
                </Card>
              </TabsContent>
              
              <TabsContent value="events" className="mt-4">
                <Card className="p-4">
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No upcoming events
                  </p>
                </Card>
              </TabsContent>
              
              <TabsContent value="activity" className="mt-4">
                <Card className="p-4">
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No recent activity
                  </p>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default UserProfile;
