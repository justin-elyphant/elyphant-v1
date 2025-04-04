
import { useState } from "react";
import { Connection, RelationshipType } from "@/types/connections";
import { toast } from "sonner";

// Mock data
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

const mockSuggestions: Connection[] = [
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

export const useConnections = () => {
  const [connections, setConnections] = useState<Connection[]>(mockConnections);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("friends");
  
  const filteredConnections = connections.filter(connection => {
    return (
      connection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      connection.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });
  
  const friends = filteredConnections.filter(conn => conn.type === 'friend');
  const following = filteredConnections.filter(conn => conn.type === 'following');
  const suggestions = mockSuggestions;

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

  const handleSendVerificationRequest = (connectionId: string, dataType: keyof Connection['dataStatus']) => {
    toast.success(`Verification request for ${dataType} sent to ${connections.find(c => c.id === connectionId)?.name}`);
  };

  return {
    connections,
    searchTerm,
    setSearchTerm,
    activeTab,
    setActiveTab,
    filteredConnections,
    friends,
    following,
    suggestions,
    handleRelationshipChange,
    handleSendVerificationRequest
  };
};
