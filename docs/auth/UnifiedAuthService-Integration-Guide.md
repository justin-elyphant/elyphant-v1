# UnifiedAuthService Integration Guide

## Overview

The `UnifiedAuthService` is a comprehensive authentication service that enhances the existing auth infrastructure with advanced security features, caching, and audit logging.

## Key Features

- **Enhanced Password Reset Flow**: Secure token validation with caching
- **Security Logging**: Comprehensive audit trails for all auth events
- **Rate Limiting**: Protection against brute force attacks
- **Suspicious Activity Detection**: Automated detection of attack patterns
- **Backward Compatibility**: Works alongside existing auth infrastructure

## Usage

### Basic Import

```typescript
import { unifiedAuthService } from '@/services/auth/UnifiedAuthService';
```

### Password Reset Flow

#### 1. Initiate Password Reset

```typescript
const result = await unifiedAuthService.initiatePasswordReset(email);

if (result.success) {
  console.log(result.message); // 'Password reset email sent successfully'
} else {
  console.error(result.error); // Error message
}
```

#### 2. Validate Reset Token

```typescript
const validation = await unifiedAuthService.validateResetToken(token);

if (validation.isValid) {
  // Proceed with password reset
} else {
  console.error(validation.error); // 'Invalid or expired token'
}
```

#### 3. Complete Password Reset

```typescript
const result = await unifiedAuthService.completePasswordReset(newPassword, {
  validateToken: true,
  sendNotification: true,
  invalidateOtherSessions: true
});

if (result.success) {
  console.log(result.message); // 'Password reset successfully'
}
```

### Token Processing (Internal Use)

#### Process URL Hash Tokens

```typescript
const result = await unifiedAuthService.processUrlTokens();
```

#### Process Session Storage Tokens

```typescript
const result = await unifiedAuthService.processStoredTokens();
```

### Utility Methods

#### Cache Management

```typescript
// Get cache statistics
const stats = unifiedAuthService.getCacheStats();

// Clear cache
unifiedAuthService.clearCache();

// Cleanup expired tokens
await unifiedAuthService.cleanupExpiredTokens();
```

#### Rate Limiting

```typescript
const rateLimitStatus = await unifiedAuthService.getRateLimitStatus();
console.log(rateLimitStatus); // { isLimited: false, dailyCount: 5, resetTime: null }
```

## Integration with Existing Components

### Current Auth Infrastructure (Preserved)

The following components remain unchanged and continue to work:

- `AuthProvider.tsx` - Main auth context provider
- `useAuthSession.ts` - Session management hook
- `authHooks.ts` - Sign out and delete user functions
- All `supabase.auth.getUser()` calls in other services

### Enhanced Components

The following components now use `UnifiedAuthService`:

- `ForgotPassword.tsx` - Uses `initiatePasswordReset()`
- `ResetPasswordLaunch.tsx` - Uses `validateResetToken()` and `initiatePasswordReset()`
- `ResetPassword.tsx` - Uses `processUrlTokens()`, `processStoredTokens()`, and `completePasswordReset()`

## Security Features

### Input Validation

- Email format validation
- Password strength checking
- Attack pattern detection (SQL injection, XSS, etc.)

### Rate Limiting

- Integration with existing `message_rate_limits` table
- Automatic detection and logging of rate limit violations

### Audit Logging

- All auth events logged to `security_logs` table
- Risk level classification (low, medium, high, critical)
- Metadata tracking (URL, referrer, user agent, etc.)

### Suspicious Activity Detection

- Multiple reset attempts within short timeframes
- Invalid token patterns
- Attack signature recognition

## Error Handling

The service provides consistent error handling with user-friendly messages:

```typescript
// Result structure
interface PasswordResetResult {
  success: boolean;
  error?: string;
  message?: string;
}
```

Common error scenarios:

- Invalid email format
- Rate limiting exceeded
- Suspicious activity detected
- Token validation failures
- Network/service errors

## Caching Strategy

- **Token Validation**: 5-minute cache for valid tokens, 1-minute for invalid
- **Rate Limit Status**: 5-minute cache aligned with other services
- **Automatic Cleanup**: Expired entries removed automatically

## Configuration

The service uses the following configuration:

```typescript
private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
private readonly TOKEN_TTL = 60 * 60 * 1000; // 1 hour
```

Security settings can be adjusted via `authProtection.updateSettings()`:

```typescript
authProtection.updateSettings({
  enableRateLimit: true,
  enableAuditLogging: true,
  enableSuspiciousActivityDetection: true,
  tokenCacheEnabled: true
});
```

## Migration from Direct Supabase Calls

### Before (Direct Supabase)

```typescript
const { error } = await supabase.auth.resetPasswordForEmail(email);
```

### After (UnifiedAuthService)

```typescript
const result = await unifiedAuthService.initiatePasswordReset(email);
```

The new approach provides:
- Enhanced security logging
- Input validation and sanitization
- Rate limiting protection
- Suspicious activity detection
- Consistent error handling

## Troubleshooting

### Common Issues

1. **Cache Not Working**: Check if `tokenCacheEnabled` is true in settings
2. **Rate Limiting Too Aggressive**: Adjust limits in database configuration
3. **Security Events Not Logging**: Verify user authentication and database permissions

### Debug Information

```typescript
// Get cache statistics
console.log(unifiedAuthService.getCacheStats());

// Check rate limit status
console.log(await unifiedAuthService.getRateLimitStatus());
```

## Best Practices

1. **Always Check Results**: Handle both success and error cases
2. **Use Type Safety**: Import proper TypeScript interfaces
3. **Monitor Security Events**: Regularly check security logs for anomalies
4. **Cache Awareness**: Understand caching behavior for performance optimization
5. **Gradual Adoption**: Existing components can adopt features incrementally

## Support

For issues or questions:

1. Check console logs for detailed error information
2. Review security logs in the database
3. Verify network connectivity to Supabase functions
4. Ensure proper environment configuration