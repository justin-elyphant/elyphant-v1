export type RelationshipType = 
  // Family - Parents
  | 'father' | 'mother' | 'parent'
  // Family - Children
  | 'son' | 'daughter' | 'child'
  // Family - Siblings
  | 'brother' | 'sister' | 'sibling'
  // Family - Extended
  | 'uncle' | 'aunt' | 'cousin'
  | 'nephew' | 'niece'
  | 'grandfather' | 'grandmother' | 'grandparent'
  | 'grandson' | 'granddaughter' | 'grandchild'
  // Romantic
  | 'spouse' | 'partner' | 'fiancé' | 'fiancée'
  | 'boyfriend' | 'girlfriend'
  // Social
  | 'friend' | 'best_friend' | 'close_friend'
  | 'colleague' | 'coworker' | 'boss' | 'mentor'
  | 'neighbor'
  // Other
  | 'other' | 'custom';

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
