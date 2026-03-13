/**
 * Centralized connection status constants.
 * Single source of truth — use these everywhere instead of string literals.
 */
export const CONNECTION_STATUS = {
  PENDING: 'pending',
  PENDING_INVITATION: 'pending_invitation',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  BLOCKED: 'blocked',
} as const;

export type ConnectionStatusValue = typeof CONNECTION_STATUS[keyof typeof CONNECTION_STATUS];

/** All statuses that represent an unresolved incoming request */
export const PENDING_STATUSES: ConnectionStatusValue[] = [
  CONNECTION_STATUS.PENDING,
  CONNECTION_STATUS.PENDING_INVITATION,
];

/** Check if a status string is a valid ConnectionStatusValue */
export function isValidConnectionStatus(status: string): status is ConnectionStatusValue {
  return Object.values(CONNECTION_STATUS).includes(status as ConnectionStatusValue);
}
