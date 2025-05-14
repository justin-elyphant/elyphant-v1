
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Profile } from "@/types/profile";
import { Users } from "lucide-react";

interface ConnectTabContentProps {
  profile: Profile | null;
  isOwnProfile: boolean;
}

const ConnectTabContent: React.FC<ConnectTabContentProps> = ({ profile, isOwnProfile }) => {
  if (!profile) {
    return <div>Loading connections...</div>;
  }

  // This is a placeholder. In a real application, you would fetch and display connections
  const hasConnections = false;
  
  return (
    <div className="space-y-4">
      {isOwnProfile ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Find Friends</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Connect with friends to see their wishlists and share yours.
              </p>
              <Button>Find Friends</Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Connection Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                You have no pending connection requests.
              </p>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Connect with {profile.name || profile.username || "User"}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Send a connection request to view wishlists and get gift ideas.
            </p>
            <Button>Send Connection Request</Button>
          </CardContent>
        </Card>
      )}
      
      {hasConnections ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {/* Connection cards would go here */}
        </div>
      ) : (
        <div className="text-center py-8 border rounded-lg">
          <Users className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
          <h4 className="font-medium">No connections yet</h4>
          <p className="text-sm text-muted-foreground mt-1">
            {isOwnProfile 
              ? "Connect with friends to share wishlists and gift ideas." 
              : "This user hasn't connected with anyone yet."}
          </p>
        </div>
      )}
    </div>
  );
};

export default ConnectTabContent;
