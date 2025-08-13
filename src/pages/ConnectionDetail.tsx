import React from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, MessageCircle, Gift, Phone, Mail, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { useConnection } from "@/hooks/useConnection";
import { getRelationshipIcon, getRelationshipLabel } from "@/components/connections/RelationshipUtils";
import DataVerificationSection from "@/components/connections/DataVerificationSection";

const ConnectionDetail: React.FC = () => {
  const { connectionId } = useParams<{ connectionId: string }>();
  const { connection, loading, error } = useConnection(connectionId || "");

  if (loading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </SidebarLayout>
    );
  }

  if (error || !connection) {
    return (
      <SidebarLayout>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Connection Not Found</h1>
          <p className="text-gray-600 mb-6">The connection you're looking for doesn't exist or has been removed.</p>
          <Button asChild>
            <Link to="/connections">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Connections
            </Link>
          </Button>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" asChild>
            <Link to="/connections">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Connections
            </Link>
          </Button>
        </div>

        {/* Profile Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={connection.imageUrl} alt={connection.name} />
                <AvatarFallback className="text-2xl">{connection.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="text-2xl">{connection.name}</CardTitle>
                <p className="text-muted-foreground">@{connection.username}</p>
                <div className="flex items-center mt-2">
                  {getRelationshipIcon(connection.relationship)}
                  <span className="ml-1 text-sm font-medium">
                    {getRelationshipLabel(connection.relationship, connection.customRelationship)}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button asChild>
                  <Link to={`/messages/${connection.id}`}>
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message
                  </Link>
                </Button>
                <Button variant="outline">
                  <Gift className="w-4 h-4 mr-2" />
                  Send Gift
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {connection.bio && (
              <div className="mb-4">
                <h3 className="font-medium mb-2">About</h3>
                <p className="text-muted-foreground">{connection.bio}</p>
              </div>
            )}
            
            {connection.interests && connection.interests.length > 0 && (
              <div className="mb-4">
                <h3 className="font-medium mb-2">Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {connection.interests.map(interest => (
                    <Badge key={interest} variant="secondary">{interest}</Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">{connection.mutualFriends}</span> mutual connections
              </div>
              <div>
                Connected since {connection.connectionDate ? new Date(connection.connectionDate).toLocaleDateString() : 'Unknown'}
              </div>
              <div>
                Last active: {connection.lastActive}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Verification Section */}
        <Card>
          <CardHeader>
            <CardTitle>Data Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <DataVerificationSection 
              friend={connection} 
              onVerificationRequest={(connectionId, dataType) => {
                console.log('Verification request:', connectionId, dataType);
              }} 
            />
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
};

export default ConnectionDetail;