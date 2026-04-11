

## Fix: AuthCallback `beta_approval_needed` Email Key Mismatch

### Problem
`AuthCallback.tsx` sends `metadata` with camelCase keys (`referrerName`, `inviteeName`, etc.) but the email template reads snake_case keys (`referrer_name`, `invitee_name`). This causes the admin alert email to show "Unknown" / "N/A" for all fields when a new user signs up via an invite link.

### Fix (1 file)
In `src/pages/AuthCallback.tsx` (lines 111-123), change the invocation to use `data` instead of `metadata`, with snake_case keys:

```typescript
await supabase.functions.invoke('ecommerce-email-orchestrator', {
  body: {
    eventType: 'beta_approval_needed',
    recipientEmail: 'justin@elyphant.com',
    data: {
      referrer_name: referrerProfile?.name || referrerProfile?.username || 'Unknown',
      referrer_email: referrerProfile?.email || '',
      invitee_name: data.user.user_metadata?.name || data.user.email || 'New User',
      invitee_email: data.user.email || '',
      credit_amount: 100,
    }
  }
});
```

This is the only code change needed. Everything else in the beta credit system is correctly wired.
