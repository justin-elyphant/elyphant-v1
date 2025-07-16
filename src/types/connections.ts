
export type RelationshipType = 'friend' | 'spouse' | 'cousin' | 'child' | 'parent' | 'sibling' | 'colleague' | 'custom';

export type DataVerificationStatus = {
  shipping: 'verified' | 'missing' | 'outdated';
  birthday: 'verified' | 'missing' | 'outdated';
  email: 'verified' | 'missing' | 'outdated';
};

export interface Connection {
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
  reason?: string;
  connectionDate?: string;
  score?: number; // Add optional score property for suggestions
  isPending?: boolean; // For pending connections from quick gift wizard
  recipientEmail?: string; // Email for pending connections
}

export type ConnectionRequest = {
  id: string;
  userId: string;
  name: string;
  username: string;
  imageUrl?: string;
  requestDate: string;
  status: 'pending' | 'accepted' | 'rejected';
};
