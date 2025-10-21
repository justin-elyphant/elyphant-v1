
export type RelationshipType = 'friend' | 'spouse' | 'cousin' | 'child' | 'parent' | 'sibling' | 'colleague' | 'custom';

export type DataVerificationStatus = {
  shipping: 'verified' | 'missing' | 'outdated' | 'blocked';
  birthday: 'verified' | 'missing' | 'outdated' | 'blocked';
  email: 'verified' | 'missing' | 'outdated' | 'blocked';
};

export interface Connection {
  id: string;
  connectionId?: string; // Add connection record ID for operations
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
  isIncoming?: boolean; // For incoming connection requests
  status?: string; // Connection status (pending, pending_invitation, accepted, etc.)
  hasPendingGift?: boolean; // Gift context from database
  giftOccasion?: string; // Gift occasion (birthday, christmas, etc.)
  giftMessage?: string; // Optional message with the gift
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
