export interface DataConsistencyState {
  isValidating: boolean;
  lastValidated: Date | null;
  issues: string[];
  hasIssues: boolean;
}

export interface ValidationRule {
  name: string;
  check: () => Promise<boolean>;
  message: string;
  autoFix?: () => Promise<void>;
}