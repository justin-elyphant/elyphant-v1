
import { RelationshipType } from "./connections";

export interface ConnectionFilters {
  relationship?: RelationshipType | 'all';
  verificationStatus?: 'verified' | 'incomplete' | 'all';
}
