import { User, Session } from '@supabase/supabase-js';

export interface AuthTokenData {
  access_token: string;
  refresh_token: string;
  timestamp: number;
  expires: number;
}

export interface PasswordResetResult {
  success: boolean;
  error?: string;
  message?: string;
}

export interface TokenValidationResult {
  isValid: boolean;
  error?: string;
  session?: Session;
}

export interface SecurityEventDetails {
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  description?: string;
  metadata?: Record<string, any>;
  [key: string]: any;
}

export interface AuthSecuritySettings {
  enableRateLimit: boolean;
  enableAuditLogging: boolean;
  enableSuspiciousActivityDetection: boolean;
  tokenCacheEnabled: boolean;
}

export interface PasswordResetOptions {
  validateToken?: boolean;
  sendNotification?: boolean;
  invalidateOtherSessions?: boolean;
}

export interface AuthCacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface RateLimitStatus {
  isLimited: boolean;
  dailyCount: number;
  resetTime: Date | null;
}

export interface AuthEventType {
  PASSWORD_RESET_INITIATED: 'password_reset_initiated';
  PASSWORD_RESET_COMPLETED: 'password_reset_completed';
  TOKEN_VALIDATION_FAILED: 'token_validation_failed';
  SUSPICIOUS_RESET_ACTIVITY: 'suspicious_reset_activity';
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded';
}

export const AUTH_EVENTS: AuthEventType = {
  PASSWORD_RESET_INITIATED: 'password_reset_initiated',
  PASSWORD_RESET_COMPLETED: 'password_reset_completed',
  TOKEN_VALIDATION_FAILED: 'token_validation_failed',
  SUSPICIOUS_RESET_ACTIVITY: 'suspicious_reset_activity',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded'
};