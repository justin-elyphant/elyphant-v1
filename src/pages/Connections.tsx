
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search, UserPlus, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useLocalStorage } from "@/components/gifting/hooks/useLocalStorage";

// Mock connection data - in a real app, this would be fetched from a database
const mockConnections = [
  {
    id: '1',
    name: 'Alex Johnson',
    username: '@alexj',
    imageUrl: '/placeholder.svg',
    mutualFriends: 12,
    type: 'friend',
    lastActive: '2 hours ago'
  },
  {
    id: '2',
    name: 'Jamie Smith',
    username: '@jamiesmith',
    imageUrl: '/placeholder.svg',
    mutualFriends: 5,
    type: 'friend',
    lastActive: '1 day ago'
  },
  {
    id: '3',
    name: 'Taylor Wilson',
    username: '@taywil',
    imageUrl: '/placeholder.svg',
    mutualFriends: 8,
    type: 'friend',
    lastActive: '3 days ago'
  },
  {
    id: '4',
    name: 'Jordan Parks',
    username: '@jordyp',
    imageUrl: '/placeholder.svg',
    mutualFriends: 2,
    type: 'following',
    lastActive: 'Just now'
  },
  {
    id: '5',
    name: 'Casey Morgan',
    username: '@caseymorgan',
    imageUrl: '/placeholder.svg',
    mutualFriends: 0,
    type: 'following',
    lastActive: '1 week ago'
  }
];

// Mock suggestions data - in a real app, this would be generated based on user data
const mockSuggestions = [
  {
    id: '6',
    name: 'Riley Thomas',
    username: '@rileyt',
    imageUrl: '/placeholder.svg',
    mutualFriends: 4,
    type: 'suggestion',
    reason: 'Based on your interests'
  },
  {
    id: '7',
    name: 'Morgan Lee',
    username: '@morganlee',
    imageUrl: '/placeholder.svg',
    mutualFriends: 7,
    type: 'suggestion',
    reason: 'Friends with Alex Johnson'
  },
  {
    id: '8',
    name: 'Avery Clark',
    username: '@averyclark',
    imageUrl: '/placeholder.svg',
    mutualFriends: 3,
    type: 'suggestion',
    reason: 'Connected to your recent activity'
  }
];

const Connections = () => {
  const [userData] = useLocalStorage("userData", null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("friends");
  
  // Filter connections based on search term
  const filteredConnections = mockConnections.filter(connection => {
    return (
      connection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      connection.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });
  
  // Filter connections based on type for different tabs
  const friends = filteredConnections.filter(conn => conn.type === 'friend');
  const following = filteredConnections.filter(conn => conn.type === 'following');
  
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Button variant="ghost" asChild className="p-0">
          <Link to="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Connections</h1>
          <p className="text-muted-foreground">Manage your friends and followings</p>
        </div>
        <div className="flex gap-2">
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Connection
          </Button>
        </div>
      </div>
      
      <div className="flex items-center space-x-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search connections..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="w-full max-w-md">
          <TabsTrigger value="friends" className="flex-1">Friends</TabsTrigger>
          <TabsTrigger value="following" className="flex-1">Following</TabsTrigger>
          <TabsTrigger value="suggestions" className="flex-1">Suggestions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="friends" className="mt-6">
          {friends.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {friends.map(friend => (
                <Card key={friend.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={friend.imageUrl} alt={friend.name} />
                          <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{friend.name}</CardTitle>
                          <CardDescription>{friend.username}</CardDescription>
                        </div>
                      </div>
                      <Badge variant="outline">Friend</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">{friend.mutualFriends}</span> mutual connections
                    </p>
                    <p className="text-xs text-muted-foreground">Active {friend.lastActive}</p>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/profile/${friend.id}`}>View Profile</Link>
                    </Button>
                    <Button variant="ghost" size="sm">
                      Remove
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">No friends found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm 
                  ? `No results for "${searchTerm}"`
                  : "You haven't added any friends yet"}
              </p>
              <Button asChild>
                <Link to="/connections?tab=suggestions">Find Friends</Link>
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="following" className="mt-6">
          {following.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {following.map(follow => (
                <Card key={follow.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={follow.imageUrl} alt={follow.name} />
                          <AvatarFallback>{follow.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{follow.name}</CardTitle>
                          <CardDescription>{follow.username}</CardDescription>
                        </div>
                      </div>
                      <Badge variant="secondary">Following</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">{follow.mutualFriends}</span> mutual connections
                    </p>
                    <p className="text-xs text-muted-foreground">Active {follow.lastActive}</p>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/profile/${follow.id}`}>View Profile</Link>
                    </Button>
                    <Button variant="ghost" size="sm">
                      Unfollow
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">Not following anyone</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm 
                  ? `No results for "${searchTerm}"`
                  : "You haven't followed anyone yet"}
              </p>
              <Button asChild>
                <Link to="/connections?tab=suggestions">Discover People</Link>
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="suggestions" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockSuggestions.map(suggestion => (
              <Card key={suggestion.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={suggestion.imageUrl} alt={suggestion.name} />
                        <AvatarFallback>{suggestion.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{suggestion.name}</CardTitle>
                        <CardDescription>{suggestion.username}</CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">{suggestion.mutualFriends}</span> mutual connections
                  </p>
                  <p className="text-xs">
                    {suggestion.reason}
                  </p>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button size="sm">
                    <UserPlus className="h-3 w-3 mr-2" />
                    Connect
                  </Button>
                  <Button variant="ghost" size="sm">
                    Dismiss
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
      
      <Separator className="my-8" />
      
      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-medium mb-2">Privacy Settings</h3>
        <p className="text-muted-foreground mb-4">
          Control who can see your connections and interact with you
        </p>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">Allow friend requests</p>
              <p className="text-sm text-muted-foreground">Let others connect with you</p>
            </div>
            <Button variant="outline">Manage</Button>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">Connection visibility</p>
              <p className="text-sm text-muted-foreground">Control who can see your connections</p>
            </div>
            <Button variant="outline">Manage</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Connections;
