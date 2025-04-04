
export type RelationshipType = 'friend' | 'spouse' | 'cousin' | 'child' | 'custom';

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
}
