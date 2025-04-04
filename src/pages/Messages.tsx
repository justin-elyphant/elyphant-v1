
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useConnections } from "@/hooks/useConnections";
import { useAuth } from "@/contexts/AuthContext";
import ChatInterface from "@/components/messaging/ChatInterface";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare } from "lucide-react";

const Messages = () => {
  const { connectionId } = useParams<{ connectionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { connections, filteredConnections } = useConnections();
  const [selectedConnection, setSelectedConnection] = useState<string | null>(connectionId || null);

  // If we have a connectionId in the URL, use that
  useEffect(() => {
    if (connectionId) {
      setSelectedConnection(connectionId);
    } else if (filteredConnections.length > 0 && !selectedConnection) {
      // If no connection is selected but we have connections, select the first one
      setSelectedConnection(filteredConnections[0].id);
      navigate(`/messages/${filteredConnections[0].id}`);
    }
  }, [connectionId, filteredConnections, navigate, selectedConnection]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate("/sign-in");
    }
  }, [user, navigate]);

  if (!user) {
    return null; // Don't render anything while redirecting
  }

  const handleSelectConnection = (id: string) => {
    setSelectedConnection(id);
    navigate(`/messages/${id}`);
  };

  const selectedConnectionData = filteredConnections.find(c => c.id === selectedConnection);

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Connections Sidebar */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Connections</CardTitle>
            <CardDescription>Select a connection to chat with</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {filteredConnections.length > 0 ? (
                filteredConnections.map((connection) => (
                  <Button
                    key={connection.id}
                    variant={selectedConnection === connection.id ? "secondary" : "ghost"}
                    className="w-full justify-start px-4 py-6"
                    onClick={() => handleSelectConnection(connection.id)}
                  >
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarFallback>{connection.name.charAt(0)}</AvatarFallback>
                      <AvatarImage src={connection.imageUrl} alt={connection.name} />
                    </Avatar>
                    <span>{connection.name}</span>
                  </Button>
                ))
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  <p>No connections yet</p>
                  <Button 
                    variant="link" 
                    onClick={() => navigate('/connections')}
                    className="mt-2"
                  >
                    Find connections
                  </Button>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
        
        {/* Chat Area */}
        <Card className="md:col-span-3">
          <CardContent className="p-0">
            {selectedConnection && selectedConnectionData ? (
              <ChatInterface 
                connectionId={selectedConnection}
                connectionName={selectedConnectionData.name}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-[600px] text-center p-4">
                <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium mb-2">No conversation selected</h3>
                <p className="text-muted-foreground mb-4">
                  Select a connection from the sidebar to start chatting
                </p>
                {filteredConnections.length === 0 && (
                  <Button onClick={() => navigate('/connections')}>
                    Find connections
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Messages;
