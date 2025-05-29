
export type AutoGiftStatus = "all" | "disabled" | "enabled";
export type UrgencyLevel = "all" | "urgent" | "soon" | "later";
export type SortField = "date" | "person" | "type" | "priority" | "created";
export type SortDirection = "asc" | "desc";

export interface FilterState {
  search: string;
  eventTypes: string[];
  dateRange: { from: Date | null; to: Date | null };
  autoGiftStatus: AutoGiftStatus;
  urgencyLevel: UrgencyLevel;
}

export interface SortState {
  field: SortField;
  direction: SortDirection;
}
