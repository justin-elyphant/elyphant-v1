# UnifiedAuthService Emergency Procedures

## Emergency Contacts

- **System Administrator:** [Contact Info]
- **Security Team:** [Contact Info]
- **Development Team:** [Contact Info]

## 🚨 IMMEDIATE RESPONSE PROCEDURES

### 1. Service Degradation or Failure

**Symptoms:**
- Password reset functionality not working
- Users unable to authenticate
- High error rates in auth operations

**Immediate Actions:**

1. **Check Service Status:**
   ```typescript
   // Verify UnifiedAuthService is responding
   const stats = unifiedAuthService.getCacheStats();
   console.log('Service status:', stats);
   ```

2. **Fallback to Legacy System:**
   ```typescript
   // Temporarily disable UnifiedAuthService in affected components
   // Revert to direct Supabase calls
   const { error } = await supabase.auth.resetPasswordForEmail(email);
   ```

3. **Clear All Caches:**
   ```typescript
   unifiedAuthService.clearCache();
   await unifiedAuthService.cleanupExpiredTokens();
   ```

### 2. Security Breach Detection

**Symptoms:**
- Unusual spike in failed authentication attempts
- Multiple suspicious activity alerts
- Unexpected admin access patterns

**Immediate Actions:**

1. **Enable Emergency Mode:**
   ```typescript
   authProtection.updateSettings({
     enableRateLimit: true,
     enableAuditLogging: true,
     enableSuspiciousActivityDetection: true,
     tokenCacheEnabled: false // Disable cache during incident
   });
   ```

2. **Increase Rate Limiting:**
   ```sql
   -- Temporarily reduce rate limits
   UPDATE message_rate_limits 
   SET messages_sent_today = 999999 
   WHERE is_rate_limited = false;
   ```

3. **Force Session Invalidation:**
   ```typescript
   // Sign out all users if compromise suspected
   await supabase.auth.signOut({ scope: 'global' });
   ```

### 3. Database Connection Issues

**Symptoms:**
- Auth operations timing out
- Database query failures
- Rate limiting not working

**Immediate Actions:**

1. **Check Database Connectivity:**
   ```typescript
   try {
     const { data } = await supabase.from('security_logs').select('count').limit(1);
     console.log('Database accessible:', !!data);
   } catch (error) {
     console.error('Database connection failed:', error);
   }
   ```

2. **Enable Offline Mode:**
   ```typescript
   // Disable features requiring database access
   authProtection.updateSettings({
     enableAuditLogging: false,
     enableSuspiciousActivityDetection: false
   });
   ```

3. **Use Local Storage Fallback:**
   ```typescript
   // Store critical data locally if database unavailable
   localStorage.setItem('auth_emergency_mode', 'true');
   ```

## 🔧 RECOVERY PROCEDURES

### 1. Service Recovery Checklist

**Step 1: Assess Damage**
- [ ] Identify affected components
- [ ] Determine scope of user impact
- [ ] Check data integrity
- [ ] Review security logs

**Step 2: Stabilize System**
- [ ] Restore service functionality
- [ ] Verify auth flows working
- [ ] Test rate limiting
- [ ] Confirm audit logging

**Step 3: Validate Recovery**
- [ ] Run full integration tests
- [ ] Verify user authentication works
- [ ] Check all unified services
- [ ] Monitor for recurring issues

### 2. Security Incident Recovery

**Step 1: Contain Breach**
- [ ] Isolate affected systems
- [ ] Preserve evidence
- [ ] Document incident timeline
- [ ] Notify stakeholders

**Step 2: Eradicate Threats**
- [ ] Apply security patches
- [ ] Update authentication rules
- [ ] Revoke compromised tokens
- [ ] Clean up malicious data

**Step 3: Restore Services**
- [ ] Gradually restore functionality
- [ ] Monitor for anomalies
- [ ] Verify security measures
- [ ] Update incident documentation

## 🔍 DIAGNOSTIC PROCEDURES

### 1. Performance Diagnostics

```typescript
// Check cache performance
const cacheStats = unifiedAuthService.getCacheStats();
console.log('Cache entries:', cacheStats.size);
console.log('Cache keys:', cacheStats.entries);

// Check rate limiting status
const rateLimitStatus = await unifiedAuthService.getRateLimitStatus();
console.log('Rate limit status:', rateLimitStatus);

// Monitor auth events
const recentEvents = await supabase
  .from('security_logs')
  .select('*')
  .like('event_type', 'auth_%')
  .order('created_at', { ascending: false })
  .limit(10);
```

### 2. Security Diagnostics

```sql
-- Check for suspicious activity
SELECT 
  event_type,
  COUNT(*) as count,
  MAX(created_at) as latest_event
FROM security_logs 
WHERE created_at > NOW() - INTERVAL '1 hour'
  AND risk_level IN ('high', 'critical')
GROUP BY event_type
ORDER BY count DESC;

-- Check rate limiting patterns
SELECT 
  user_id,
  messages_sent_today,
  is_rate_limited,
  rate_limit_expires_at
FROM message_rate_limits 
WHERE is_rate_limited = true
ORDER BY rate_limit_expires_at DESC;
```

### 3. System Health Check

```typescript
const healthCheck = async () => {
  const results = {
    authService: false,
    database: false,
    rateLimit: false,
    cache: false
  };

  try {
    // Test auth service
    const stats = unifiedAuthService.getCacheStats();
    results.authService = !!stats;

    // Test database
    const { data } = await supabase.from('security_logs').select('count').limit(1);
    results.database = !!data;

    // Test rate limiting
    const { data: user } = await supabase.auth.getUser();
    if (user) {
      const rateLimitStatus = await unifiedAuthService.getRateLimitStatus();
      results.rateLimit = rateLimitStatus !== null;
    }

    // Test cache
    unifiedAuthService.clearCache();
    results.cache = true;

  } catch (error) {
    console.error('Health check failed:', error);
  }

  return results;
};
```

## 📞 ESCALATION PROCEDURES

### Level 1: Service Issues
- **Response Time:** 15 minutes
- **Escalate To:** Development Team
- **Actions:** Restart services, clear caches

### Level 2: Security Incidents
- **Response Time:** 5 minutes
- **Escalate To:** Security Team
- **Actions:** Enable emergency mode, preserve evidence

### Level 3: Data Breach
- **Response Time:** Immediate
- **Escalate To:** Security Team + Management
- **Actions:** Full system lockdown, external notification

## 📋 POST-INCIDENT PROCEDURES

### 1. Incident Documentation

**Required Information:**
- [ ] Incident timeline
- [ ] Root cause analysis
- [ ] Impact assessment
- [ ] Response actions taken
- [ ] Recovery procedures used

### 2. Lessons Learned

**Review Process:**
- [ ] What worked well?
- [ ] What could be improved?
- [ ] Additional monitoring needed?
- [ ] Process updates required?

### 3. Prevention Measures

**Implementation:**
- [ ] Update monitoring alerts
- [ ] Improve detection rules
- [ ] Enhance security measures
- [ ] Update documentation

## 🛠️ TOOLS AND RESOURCES

### Monitoring Tools
- Supabase Dashboard
- Security logs database
- Performance monitoring
- Cache statistics

### Emergency Scripts
- Service restart procedures
- Cache cleanup utilities
- Database health checks
- Security event queries

### Documentation
- System architecture diagrams
- API documentation
- Security procedures
- Contact information

---

**Remember:** In any emergency, prioritize user safety and data security over service availability. When in doubt, err on the side of caution and escalate immediately.