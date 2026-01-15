
import React, { useState, useEffect } from "react";
import { Search, UserPlus, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";
import { searchFriends, FriendSearchResult } from "@/services/search/privacyAwareFriendSearch";
import { sendConnectionRequest } from "@/services/connections/connectionService";

const EnhancedConnectionSearch = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<FriendSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const searchUsers = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const friendResults = await searchFriends(query, user?.id);
      setResults(friendResults);
    } catch (error) {
      console.error('Search error:', error);
      toast.error("Error searching for users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      searchUsers(searchTerm);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const handleSendConnectionRequest = async (targetUserId: string, targetName: string) => {
    if (!user) return;

    try {
      const result = await sendConnectionRequest(targetUserId, 'friend');
      
      if (result.success) {
        toast.success(`Connection request sent to ${targetName}`);
        
        // Update local results
        setResults(prev => prev.map(result => 
          result.id === targetUserId 
            ? { ...result, connectionStatus: 'pending' }
            : result
        ));
      } else {
        toast.error("Failed to send connection request");
      }
    } catch (error) {
      console.error('Error sending connection request:', error);
      toast.error("Failed to send connection request");
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search for people by name, username, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 animate-spin" />
        )}
      </div>

      {results.length > 0 && (
        <div className="space-y-3">
          {results.map((result) => (
            <Card key={result.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={result.profile_image} />
                    <AvatarFallback>
                      {result.name?.substring(0, 2).toUpperCase() || 'UN'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium">{result.name || 'Unknown User'}</h4>
                    <p className="text-sm text-muted-foreground">
                      {result.username || '@unknown'}
                    </p>
                    {result.bio && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {result.bio}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {result.connectionStatus === 'connected' && (
                    <Badge variant="secondary">Connected</Badge>
                  )}
                  {result.connectionStatus === 'pending' && (
                    <Badge variant="outline">Request Sent</Badge>
                  )}
                  {result.connectionStatus === 'none' && (
                    <Button
                      size="sm"
                      onClick={() => handleSendConnectionRequest(result.id, result.name)}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Connect
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {searchTerm.length >= 2 && !loading && results.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No users found for "{searchTerm}"</p>
        </div>
      )}
    </div>
  );
};

export default EnhancedConnectionSearch;
