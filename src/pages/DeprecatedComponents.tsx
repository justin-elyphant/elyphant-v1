/**
 * This file tracks components that need to be removed as part of the 
 * Enhanced Onboarding Implementation Plan - Phase 2: Consolidate Signup Components
 * 
 * Components marked for removal:
 * - NicoleOnboarding.tsx (and related files)
 * - Any duplicate signup flows not using StreamlinedSignUp.tsx
 * - Legacy onboarding components using deprecated localStorage
 * 
 * To maintain marketplace and Zinc API functionality, these components
 * should be gradually migrated to use LocalStorageService instead.
 */

// This is a placeholder file to track cleanup work
export const DEPRECATED_COMPONENTS = [
  'NicoleOnboarding.tsx',
  'src/pages/SignUp.tsx', // Legacy signup, replace with StreamlinedSignUp
  'src/pages/auth/SignUp.tsx', // Another legacy signup
  'src/pages/ProfileSetup.tsx', // Should be consolidated
];

export const DEPRECATED_LOCALSTORAGE_KEYS = [
  'userIntent',
  'newSignUp', 
  'showingIntentModal',
  'ctaIntent',
  'bypassVerification',
  'emailVerified',
  'verifiedEmail',
  'pendingVerificationEmail',
  'pendingVerificationName',
  'verificationResendCount',
  'signupRedirectPath',
  'pendingProfileData',
  'blockAutoRedirect',
  'userName',
  'userEmail',
  'nextStepsOption',
  'profileCompleted',
  'onboardingComplete',
  'fromSignIn',
  'redirectAfterSignIn'
];

// TODO: Replace all usage of these keys with LocalStorageService methods