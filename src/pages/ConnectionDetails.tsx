
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Gift, UserPlus, Calendar, Mail, Heart, MapPin, BadgeInfo, MessageCircle } from "lucide-react";
import { Connection } from "@/types/connections";
import { toast } from "sonner";
import { getRelationshipIcon, getRelationshipLabel } from "@/components/connections/RelationshipUtils";
import useConnectionsById from "@/hooks/useConnectionById";

const ConnectionDetails = () => {
  const { connectionId } = useParams<{ connectionId: string }>();
  const { connection, loading, error, updateRelationship, sendVerificationRequest } = useConnectionsById(connectionId || "");
  const [activeTab, setActiveTab] = useState("profile");

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="flex items-center space-x-4 mb-6">
          <Button variant="ghost" asChild className="p-0">
            <Link to="/connections">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Connections
            </Link>
          </Button>
        </div>
        <div className="animate-pulse">
          <div className="h-48 bg-gray-200 rounded-t-lg mb-16"></div>
          <div className="h-32 w-32 bg-gray-300 rounded-full mx-8 -mt-16 mb-8"></div>
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4 mx-8"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-8 mx-8"></div>
        </div>
      </div>
    );
  }

  if (error || !connection) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="flex items-center space-x-4 mb-6">
          <Button variant="ghost" asChild className="p-0">
            <Link to="/connections">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Connections
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <BadgeInfo className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Connection not found</h3>
              <p className="text-muted-foreground mb-4">
                The connection you're looking for doesn't exist or has been removed.
              </p>
              <Button asChild>
                <Link to="/connections">Go back to Connections</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleRelationshipUpdate = (newRelationship: string, customValue?: string) => {
    updateRelationship(newRelationship as any, customValue);
  };

  const handleVerificationRequest = (dataType: keyof Connection['dataStatus']) => {
    sendVerificationRequest(dataType);
  };

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center space-x-4 mb-6">
        <Button variant="ghost" asChild className="p-0">
          <Link to="/connections">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Connections
          </Link>
        </Button>
      </div>

      <div className="bg-muted h-48 rounded-t-lg relative mb-16">
        <div className="absolute -bottom-16 left-8">
          <Avatar className="h-32 w-32 border-4 border-white">
            <AvatarImage src={connection.imageUrl} alt={connection.name} />
            <AvatarFallback>{connection.name.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>
        
        <div className="absolute bottom-4 right-4 flex gap-2">
          <Button 
            size="sm" 
            variant="secondary"
            className="flex items-center gap-1"
            onClick={() => {
              const relationshipTypes = ["friend", "spouse", "cousin", "child"];
              const currentIndex = relationshipTypes.indexOf(connection.relationship as string);
              const nextIndex = (currentIndex + 1) % relationshipTypes.length;
              handleRelationshipUpdate(relationshipTypes[nextIndex]);
            }}
          >
            {getRelationshipIcon(connection.relationship)}
            <span>{getRelationshipLabel(connection.relationship, connection.customRelationship)}</span>
          </Button>
          <Button size="sm" variant="secondary">
            <MessageCircle className="h-4 w-4 mr-1" />
            Message
          </Button>
          <Button size="sm" variant="secondary">
            <Gift className="h-4 w-4 mr-1" />
            Gift
          </Button>
        </div>
      </div>

      <div className="pl-8 mb-8">
        <h1 className="text-2xl font-bold">{connection.name}</h1>
        <p className="text-muted-foreground">{connection.username}</p>
        <div className="flex items-center gap-6 mt-2 text-sm text-muted-foreground">
          <div className="flex items-center">
            <UserPlus className="h-4 w-4 mr-1" />
            <span className="font-medium">{connection.mutualFriends}</span> mutual connections
          </div>
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            Active {connection.lastActive}
          </div>
        </div>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="w-full max-w-md">
          <TabsTrigger value="profile" className="flex-1">Profile</TabsTrigger>
          <TabsTrigger value="data" className="flex-1">Data Status</TabsTrigger>
          <TabsTrigger value="gifting" className="flex-1">Gifting</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              {connection.bio ? (
                <p className="mb-6">{connection.bio}</p>
              ) : (
                <p className="text-muted-foreground mb-6">No bio available</p>
              )}
              
              <h3 className="text-lg font-medium mb-3">Interests</h3>
              {connection.interests && connection.interests.length > 0 ? (
                <div className="flex flex-wrap gap-2 mb-6">
                  {connection.interests.map(interest => (
                    <Badge key={interest} variant="secondary">{interest}</Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground mb-6">No interests listed</p>
              )}
              
              <h3 className="text-lg font-medium mb-3">Relationship</h3>
              <div className="flex items-center gap-2 mb-2">
                {getRelationshipIcon(connection.relationship)}
                <span>{getRelationshipLabel(connection.relationship, connection.customRelationship)}</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => {
                  const custom = prompt('Enter custom relationship:', connection.customRelationship);
                  if (custom) handleRelationshipUpdate('custom', custom);
                }}
              >
                Change Relationship
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="data" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Verification Status</CardTitle>
              <CardDescription>Request updates for missing or outdated information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    <div>
                      <p className="font-medium">Shipping Address</p>
                      <p className="text-sm text-muted-foreground">
                        {connection.dataStatus.shipping === 'verified' ? 'Verified and up to date' : 
                         connection.dataStatus.shipping === 'outdated' ? 'Needs updating' : 
                         'Missing information'}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant={connection.dataStatus.shipping === 'verified' ? 'secondary' : 
                             connection.dataStatus.shipping === 'outdated' ? 'outline' : 'destructive'}
                    className={
                      connection.dataStatus.shipping === 'verified' ? 'bg-green-100 text-green-800' : 
                      connection.dataStatus.shipping === 'outdated' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'
                    }
                  >
                    {connection.dataStatus.shipping === 'verified' ? 'Verified' : 
                     connection.dataStatus.shipping === 'outdated' ? 'Outdated' : 
                     'Missing'}
                  </Badge>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    <div>
                      <p className="font-medium">Birthday</p>
                      <p className="text-sm text-muted-foreground">
                        {connection.dataStatus.birthday === 'verified' ? 'Verified and up to date' : 
                         connection.dataStatus.birthday === 'outdated' ? 'Needs updating' : 
                         'Missing information'}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant={connection.dataStatus.birthday === 'verified' ? 'secondary' : 
                             connection.dataStatus.birthday === 'outdated' ? 'outline' : 'destructive'}
                    className={
                      connection.dataStatus.birthday === 'verified' ? 'bg-green-100 text-green-800' : 
                      connection.dataStatus.birthday === 'outdated' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'
                    }
                  >
                    {connection.dataStatus.birthday === 'verified' ? 'Verified' : 
                     connection.dataStatus.birthday === 'outdated' ? 'Outdated' : 
                     'Missing'}
                  </Badge>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    <div>
                      <p className="font-medium">Email Address</p>
                      <p className="text-sm text-muted-foreground">
                        {connection.dataStatus.email === 'verified' ? 'Verified and up to date' : 
                         connection.dataStatus.email === 'outdated' ? 'Needs updating' : 
                         'Missing information'}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant={connection.dataStatus.email === 'verified' ? 'secondary' : 
                             connection.dataStatus.email === 'outdated' ? 'outline' : 'destructive'}
                    className={
                      connection.dataStatus.email === 'verified' ? 'bg-green-100 text-green-800' : 
                      connection.dataStatus.email === 'outdated' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'
                    }
                  >
                    {connection.dataStatus.email === 'verified' ? 'Verified' : 
                     connection.dataStatus.email === 'outdated' ? 'Outdated' : 
                     'Missing'}
                  </Badge>
                </div>
              </div>
              
              <div className="mt-8">
                <h3 className="text-lg font-medium mb-3">Request Data Updates</h3>
                <div className="flex flex-wrap gap-2">
                  {connection.dataStatus.shipping !== 'verified' && (
                    <Button 
                      size="sm" 
                      onClick={() => handleVerificationRequest('shipping')}
                    >
                      Request Shipping Address
                    </Button>
                  )}
                  {connection.dataStatus.birthday !== 'verified' && (
                    <Button 
                      size="sm" 
                      onClick={() => handleVerificationRequest('birthday')}
                    >
                      Request Birthday
                    </Button>
                  )}
                  {connection.dataStatus.email !== 'verified' && (
                    <Button 
                      size="sm" 
                      onClick={() => handleVerificationRequest('email')}
                    >
                      Request Email
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="gifting" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Gifting Preferences</CardTitle>
              <CardDescription>Set up auto-gifting and preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">Auto-Gift Eligibility</h3>
                  {Object.values(connection.dataStatus).every(status => status === 'verified') ? (
                    <div className="bg-green-50 border border-green-200 rounded-md p-4">
                      <div className="flex items-start">
                        <Heart className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                        <div>
                          <p className="font-medium text-green-800">Ready for Auto-Gifting</p>
                          <p className="text-sm text-green-700">All required data has been verified. You can set up auto-gifting for this connection.</p>
                        </div>
                      </div>
                      <Button className="mt-4" onClick={() => toast.success("Auto-gifting setup will be available soon!")}>
                        Set Up Auto-Gifting
                      </Button>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                      <div className="flex items-start">
                        <BadgeInfo className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                        <div>
                          <p className="font-medium text-yellow-800">Missing Required Data</p>
                          <p className="text-sm text-yellow-700">Some information is missing or outdated. Request verification to enable auto-gifting.</p>
                        </div>
                      </div>
                      <Button variant="outline" className="mt-4" onClick={() => setActiveTab("data")}>
                        View Data Status
                      </Button>
                    </div>
                  )}
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-medium mb-3">Important Dates</h3>
                  <p className="text-muted-foreground mb-4">No dates available yet. Add events to start tracking important dates.</p>
                  <Button variant="outline" onClick={() => toast.success("Event creation will be available soon!")}>
                    Add Important Date
                  </Button>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-medium mb-3">Gift History</h3>
                  <p className="text-muted-foreground">No gift history available yet.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConnectionDetails;
