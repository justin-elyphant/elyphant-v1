# AUTH SYSTEM PROTECTION MEASURES

> **CRITICAL:** This document outlines the protective measures for the `/auth` flow and authentication system. Follow these guidelines to prevent breaking the carefully constructed authentication architecture that supports the entire unified platform.

## Table of Contents
1. [Core Authentication Flow Protection](#core-authentication-flow-protection)
2. [Security Boundaries & Integration Points](#security-boundaries--integration-points)
3. [Development Guidelines & Restrictions](#development-guidelines--restrictions)
4. [Emergency Recovery Procedures](#emergency-recovery-procedures)

---

## Core Authentication Flow Protection

### 🔒 AuthProvider Context System - PROTECTED ZONE

**Location:** `src/contexts/auth/`

#### Critical Components That MUST NOT Be Modified:

1. **AuthProvider.tsx** - Central auth state management
   - Employee detection integration with `EmployeeDetectionService`
   - Context value provision to entire app
   - **DO NOT** modify the context structure without approval

2. **useAuthSession.ts** - Session lifecycle management
   - Auth state change listeners 
   - Token processing and validation
   - Employee routing after OAuth completion
   - **DO NOT** alter the session management logic

3. **authHooks.ts** - Authentication functions
   - SignOut and deleteUser implementations
   - **DO NOT** modify without security review

#### Protected Import Paths:
```typescript
// ✅ CORRECT - Use this standardized import path
import { useAuth } from "@/contexts/auth";

// ❌ FORBIDDEN - These paths have been deprecated
import { useAuth } from "@/contexts/AuthContext";
import { useAuth } from "@/hooks/auth";
```

### 🔐 Unified Auth Components - PROTECTED ZONE

**Location:** `src/components/auth/unified/`

#### UnifiedAuthView System:
- **UnifiedAuthView.tsx** - Tabbed interface (signin/signup)
- **SignInForm.tsx** & **SignUpForm.tsx** - Form components
- **DO NOT** alter the tab switching mechanism
- **DO NOT** modify the redirect parameter handling

#### URL Parameter Handling - CRITICAL:
```typescript
// This pattern MUST be preserved:
/auth?mode=signup&redirect=/gifting
/auth?mode=signin&redirect=/dashboard
```

### 🔄 Session Management Safeguards

#### LocalStorage Management Patterns:
```typescript
// Employee redirect handling - DO NOT MODIFY
localStorage.setItem('pendingEmployeeRedirect', 'true');
localStorage.setItem('employeeRedirectReason', detection.reason);

// Auth redirect preservation - DO NOT MODIFY  
LocalStorageService.setRedirectPath(currentPath);
```

#### Auth State Change Listeners - PROTECTED:
```typescript
// This pattern MUST be maintained
supabase.auth.onAuthStateChange((event, session) => {
  setSession(session);
  setUser(session?.user ?? null);
  // DO NOT add async operations here
});
```

---

## Security Boundaries & Integration Points

### 🛡️ Service Integration Protection

#### RLS Policy Dependencies:
- **profiles** table - User-specific data access
- **employee_detection** logic - Must work with current auth flow
- **Rate limiting integration** - `useSecurityRateLimit` hook
- **DO NOT** modify RLS policies without security review

#### User Identification Setting:
```typescript
// This pattern ensures proper user context
const { user } = useAuth();
if (!user) return; // Always check before operations
```

### 🔗 Data Flow Protection

#### Auth Context Consumption Pattern:
```typescript
// ✅ CORRECT - Proper auth context usage
const { user, session, isLoading, signOut, isEmployee } = useAuth();

// ❌ FORBIDDEN - Direct session access
const session = supabase.auth.getSession(); // Use context instead
```

#### Employee Detection Integration:
- **EmployeeDetectionService** - Determines user type
- **EmployeeRedirectHandler** - Handles post-OAuth routing
- **EmployeeRouteGuard** - Protects employee-only routes
- **DO NOT** bypass employee detection logic

#### Address Verification Integration:
- Works with profile completion flow
- **DO NOT** break the unified address verification system

### ⚠️ Error Handling & Fallback Systems

#### Auth Error Recovery Patterns:
```typescript
// User deletion detection - PROTECTED
if (error.message.includes('User from sub claim in JWT does not exist')) {
  await supabase.auth.signOut();
  return;
}
```

#### Loading States - PRESERVE:
- Auth loading during initialization
- Employee detection loading
- OAuth processing states
- **DO NOT** remove loading state management

---

## Development Guidelines & Restrictions

### ❌ FORBIDDEN MODIFICATIONS

#### Files That Require Pre-Approval:
1. `src/contexts/auth/AuthProvider.tsx`
2. `src/contexts/auth/useAuthSession.ts`
3. `src/contexts/auth/authHooks.ts`
4. `src/components/auth/EmployeeRedirectHandler.tsx`
5. `src/components/auth/EmployeeRouteGuard.tsx`
6. `src/pages/Auth.tsx`
7. `src/pages/OAuthComplete.tsx`

#### Database Functions Supporting Auth:
- Employee detection queries
- Profile creation triggers
- **DO NOT** modify without database review

#### OAuth Flow Processing:
- **DO NOT** alter OAuth redirect handling
- **DO NOT** modify employee detection after OAuth
- **DO NOT** change the OAuth completion flow

### ✅ INTEGRATION REQUIREMENTS

#### For New Features Using Auth:

1. **Always Use Auth Context:**
   ```typescript
   import { useAuth } from "@/contexts/auth";
   const { user, isLoading } = useAuth();
   ```

2. **Check Authentication State:**
   ```typescript
   if (isLoading) return <LoadingSpinner />;
   if (!user) return <AuthRequired />;
   ```

3. **Respect Employee Detection:**
   ```typescript
   const { isEmployee } = useAuth();
   if (isEmployee === null) return <Loading />; // Still detecting
   ```

4. **Use ProtectedRoute for Auth-Required Pages:**
   ```typescript
   <ProtectedRoute>
     <YourComponent />
   </ProtectedRoute>
   ```

#### Security Checks for Auth-Related Features:

1. **Rate Limiting Integration:**
   ```typescript
   const { checkRateLimit } = useSecurityRateLimit();
   await checkRateLimit('auth_action');
   ```

2. **Input Validation:**
   ```typescript
   // Use existing form validation patterns
   const validation = authValidationSchema.parse(formData);
   ```

3. **Error Handling:**
   ```typescript
   // Use toast for user feedback
   toast.error("Authentication failed");
   ```

### 🔧 MAINTENANCE GUIDELINES

#### Debugging Auth Issues:
1. Check auth state in dev tools: `useAuth()` context
2. Verify employee detection: `isEmployee` status
3. Check localStorage flags: `pendingEmployeeRedirect`
4. Review auth logs in Supabase dashboard

#### Testing Auth Changes:
1. Test all auth flows: signup, signin, signout
2. Test employee vs non-employee routing
3. Test OAuth completion with different user types
4. Verify redirect parameter preservation

#### Performance Considerations:
- **DO NOT** add heavy operations to auth state change listeners
- **DO NOT** call Supabase functions inside `onAuthStateChange`
- Use `setTimeout(0)` to defer heavy operations from auth callbacks

---

## Emergency Recovery Procedures

### 🚨 If Auth System Breaks

#### Immediate Actions:
1. **Check console for auth errors**
2. **Verify Supabase auth configuration**
3. **Check RLS policies are enabled**
4. **Validate redirect URLs in Supabase**

#### Common Issues & Solutions:

1. **"requested path is invalid" error:**
   - Check Site URL in Supabase Auth settings
   - Verify redirect URLs are configured

2. **"new row violates row-level security policy":**
   - Ensure user_id is set in insert operations
   - Check RLS policies allow user operations

3. **Auth context undefined:**
   - Verify AuthProvider wraps the component tree
   - Check import paths use `@/contexts/auth`

4. **Employee routing not working:**
   - Check EmployeeDetectionService functionality
   - Verify localStorage flags are set correctly

#### Recovery Steps:
1. **Revert to last known working commit**
2. **Check this protection document for violated guidelines**
3. **Test auth flow thoroughly before deployment**
4. **Review Supabase auth logs for errors**

### 📞 Escalation Path
If auth system remains broken after following these procedures:
1. Review recent changes against this protection document
2. Check Supabase dashboard for configuration changes
3. Restore from backup if necessary
4. Conduct full auth system audit

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|---------|
| 1.0 | 2025-09-11 | Initial protection measures documentation | System |

---

**⚠️ WARNING:** Violations of these protection measures can result in complete authentication system failure, affecting all users and unified platform services. Always review changes against this document before implementation.