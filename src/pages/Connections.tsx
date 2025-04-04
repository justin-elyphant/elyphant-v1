import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search, UserPlus, Filter, Mail, Gift, Calendar, MapPin, AlertCircle, Baby, Heart, Users, Shield, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useLocalStorage } from "@/components/gifting/hooks/useLocalStorage";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type RelationshipType = 'friend' | 'spouse' | 'cousin' | 'child' | 'custom';

type DataVerificationStatus = {
  shipping: 'verified' | 'missing' | 'outdated';
  birthday: 'verified' | 'missing' | 'outdated';
  email: 'verified' | 'missing' | 'outdated';
};

interface Connection {
  id: string;
  name: string;
  username: string;
  imageUrl: string;
  mutualFriends: number;
  type: 'friend' | 'following' | 'suggestion';
  lastActive: string;
  relationship: RelationshipType;
  customRelationship?: string;
  dataStatus: DataVerificationStatus;
  interests?: string[];
  bio?: string;
}

const mockConnections: Connection[] = [
  {
    id: '1',
    name: 'Alex Johnson',
    username: '@alexj',
    imageUrl: '/placeholder.svg',
    mutualFriends: 12,
    type: 'friend',
    lastActive: '2 hours ago',
    relationship: 'friend',
    dataStatus: {
      shipping: 'missing',
      birthday: 'verified',
      email: 'verified'
    },
    interests: ['Reading', 'Hiking', 'Photography'],
    bio: 'Passionate photographer and outdoor enthusiast.'
  },
  {
    id: '2',
    name: 'Jamie Smith',
    username: '@jamiesmith',
    imageUrl: '/placeholder.svg',
    mutualFriends: 5,
    type: 'friend',
    lastActive: '1 day ago',
    relationship: 'spouse',
    dataStatus: {
      shipping: 'verified',
      birthday: 'verified',
      email: 'verified'
    },
    interests: ['Cooking', 'Travel', 'Music'],
    bio: 'Professional chef and music enthusiast.'
  },
  {
    id: '3',
    name: 'Taylor Wilson',
    username: '@taywil',
    imageUrl: '/placeholder.svg',
    mutualFriends: 8,
    type: 'friend',
    lastActive: '3 days ago',
    relationship: 'cousin',
    dataStatus: {
      shipping: 'outdated',
      birthday: 'verified',
      email: 'missing'
    },
    interests: ['Gaming', 'Tech', 'Movies'],
    bio: 'Software developer and avid gamer.'
  },
  {
    id: '4',
    name: 'Jordan Parks',
    username: '@jordyp',
    imageUrl: '/placeholder.svg',
    mutualFriends: 2,
    type: 'following',
    lastActive: 'Just now',
    relationship: 'friend',
    dataStatus: {
      shipping: 'missing',
      birthday: 'missing',
      email: 'verified'
    },
    interests: ['Art', 'Design', 'Fashion'],
    bio: 'Creative director with a passion for sustainable fashion.'
  },
  {
    id: '5',
    name: 'Casey Morgan',
    username: '@caseymorgan',
    imageUrl: '/placeholder.svg',
    mutualFriends: 0,
    type: 'following',
    lastActive: '1 week ago',
    relationship: 'child',
    dataStatus: {
      shipping: 'verified',
      birthday: 'outdated',
      email: 'verified'
    },
    interests: ['Sports', 'Fitness', 'Nutrition'],
    bio: 'Personal trainer and nutrition coach.'
  }
];

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

const getRelationshipIcon = (relationship: RelationshipType) => {
  switch (relationship) {
    case 'spouse':
      return <Heart className="h-4 w-4" />;
    case 'cousin':
      return <Users className="h-4 w-4" />;
    case 'child':
      return <Baby className="h-4 w-4" />;
    case 'custom':
      return <Plus className="h-4 w-4" />;
    case 'friend':
    default:
      return <Users className="h-4 w-4" />;
  }
};

const getRelationshipLabel = (relationship: RelationshipType, custom?: string) => {
  if (relationship === 'custom' && custom) {
    return custom;
  }
  return relationship.charAt(0).toUpperCase() + relationship.slice(1);
};

const Connections = () => {
  const [userData] = useLocalStorage("userData", null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("friends");
  const [connections, setConnections] = useState<Connection[]>(mockConnections);
  
  const filteredConnections = connections.filter(connection => {
    return (
      connection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      connection.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });
  
  const friends = filteredConnections.filter(conn => conn.type === 'friend');
  const following = filteredConnections.filter(conn => conn.type === 'following');

  const handleRelationshipChange = (connectionId: string, newRelationship: RelationshipType, customValue?: string) => {
    setConnections(prev => 
      prev.map(conn => 
        conn.id === connectionId 
          ? { 
              ...conn, 
              relationship: newRelationship, 
              customRelationship: customValue 
            } 
          : conn
      )
    );
    
    toast.success(`Relationship updated to ${customValue || newRelationship}`);
  };

  const handleSendVerificationRequest = (connectionId: string, dataType: keyof DataVerificationStatus) => {
    toast.success(`Verification request for ${dataType} sent to ${connections.find(c => c.id === connectionId)?.name}`);
  };
  
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
                <Card key={friend.id} className="overflow-hidden">
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-1">
                            {getRelationshipIcon(friend.relationship)}
                            <span>{getRelationshipLabel(friend.relationship, friend.customRelationship)}</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem 
                            onClick={() => handleRelationshipChange(friend.id, 'friend')}
                            className="gap-2"
                          >
                            <Users className="h-4 w-4" /> Friend
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleRelationshipChange(friend.id, 'spouse')}
                            className="gap-2"
                          >
                            <Heart className="h-4 w-4" /> Spouse
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleRelationshipChange(friend.id, 'cousin')}
                            className="gap-2"
                          >
                            <Users className="h-4 w-4" /> Cousin
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleRelationshipChange(friend.id, 'child')}
                            className="gap-2"
                          >
                            <Baby className="h-4 w-4" /> Child
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              const custom = prompt('Enter custom relationship:');
                              if (custom) handleRelationshipChange(friend.id, 'custom', custom);
                            }}
                            className="gap-2"
                          >
                            <Plus className="h-4 w-4" /> Custom
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-0">
                    {friend.bio && (
                      <p className="text-sm mb-3">{friend.bio}</p>
                    )}
                    
                    {friend.interests && friend.interests.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {friend.interests.map(interest => (
                          <Badge key={interest} variant="secondary" className="text-xs">{interest}</Badge>
                        ))}
                      </div>
                    )}
                    
                    <p className="text-sm text-muted-foreground mb-1">
                      <span className="font-medium">{friend.mutualFriends}</span> mutual connections
                    </p>
                    <p className="text-xs text-muted-foreground mb-3">Active {friend.lastActive}</p>
                    
                    <div className="bg-muted p-3 rounded-md mb-3">
                      <h4 className="text-sm font-medium mb-2 flex items-center">
                        <Shield className="h-4 w-4 mr-1 text-primary" />
                        Data Verification
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <div className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            <span>Shipping Address:</span>
                          </div>
                          <div className="flex items-center">
                            {friend.dataStatus.shipping === 'verified' ? (
                              <Badge variant="outline" className="text-green-500 border-green-500">Verified</Badge>
                            ) : friend.dataStatus.shipping === 'missing' ? (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 text-red-500 p-0"
                                onClick={() => handleSendVerificationRequest(friend.id, 'shipping')}
                              >
                                <AlertCircle className="h-3 w-3 mr-1" /> Request
                              </Button>
                            ) : (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 text-amber-500 p-0"
                                onClick={() => handleSendVerificationRequest(friend.id, 'shipping')}
                              >
                                <AlertCircle className="h-3 w-3 mr-1" /> Update
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center text-sm">
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span>Birthday:</span>
                          </div>
                          <div className="flex items-center">
                            {friend.dataStatus.birthday === 'verified' ? (
                              <Badge variant="outline" className="text-green-500 border-green-500">Verified</Badge>
                            ) : friend.dataStatus.birthday === 'missing' ? (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 text-red-500 p-0"
                                onClick={() => handleSendVerificationRequest(friend.id, 'birthday')}
                              >
                                <AlertCircle className="h-3 w-3 mr-1" /> Request
                              </Button>
                            ) : (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 text-amber-500 p-0"
                                onClick={() => handleSendVerificationRequest(friend.id, 'birthday')}
                              >
                                <AlertCircle className="h-3 w-3 mr-1" /> Update
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center text-sm">
                          <div className="flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            <span>Email:</span>
                          </div>
                          <div className="flex items-center">
                            {friend.dataStatus.email === 'verified' ? (
                              <Badge variant="outline" className="text-green-500 border-green-500">Verified</Badge>
                            ) : friend.dataStatus.email === 'missing' ? (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 text-red-500 p-0"
                                onClick={() => handleSendVerificationRequest(friend.id, 'email')}
                              >
                                <AlertCircle className="h-3 w-3 mr-1" /> Request
                              </Button>
                            ) : (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 text-amber-500 p-0"
                                onClick={() => handleSendVerificationRequest(friend.id, 'email')}
                              >
                                <AlertCircle className="h-3 w-3 mr-1" /> Update
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {(friend.dataStatus.shipping !== 'verified' || 
                     friend.dataStatus.birthday !== 'verified' || 
                     friend.dataStatus.email !== 'verified') && (
                      <Alert variant="destructive" className="mb-2 p-2 text-xs">
                        <AlertCircle className="h-3 w-3" />
                        <AlertTitle className="text-xs">Auto-gifting unavailable</AlertTitle>
                        <AlertDescription className="text-xs">
                          Complete profile data to enable auto-gifting.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-between pt-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/profile/${friend.id}`}>View Profile</Link>
                    </Button>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Gift className="h-4 w-4 mr-1" />
                            Gift
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Send a gift to {friend.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
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
                <Card key={follow.id} className="overflow-hidden">
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
                  <CardContent className="pb-0">
                    {follow.bio && (
                      <p className="text-sm mb-3">{follow.bio}</p>
                    )}
                    
                    {follow.interests && follow.interests.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {follow.interests.map(interest => (
                          <Badge key={interest} variant="secondary" className="text-xs">{interest}</Badge>
                        ))}
                      </div>
                    )}
                    
                    <p className="text-sm text-muted-foreground mb-1">
                      <span className="font-medium">{follow.mutualFriends}</span> mutual connections
                    </p>
                    <p className="text-xs text-muted-foreground">Active {follow.lastActive}</p>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/profile/${follow.id}`}>View Profile</Link>
                    </Button>
                    <Button variant="outline" size="sm">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Connect
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
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">Auto-Gifting Preferences</p>
              <p className="text-sm text-muted-foreground">Set up automatic gifting for special occasions</p>
            </div>
            <Button variant="outline">Manage</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Connections;
