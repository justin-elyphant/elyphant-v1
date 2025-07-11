/**
 * Centralized localStorage service to manage all application state
 * Replaces scattered localStorage usage with unified management
 */

interface ProfileCompletionState {
  firstName: string;
  lastName: string;
  email: string;
  photo?: string;
  username: string;
  dateOfBirth?: Date;
  birthYear?: number;
  address?: string;
  step: 'signup' | 'profile' | 'intent' | 'oauth-complete' | 'completed';
  source: 'email' | 'oauth';
  oauthProvider?: string;
}

interface NicoleContext {
  source: string;
  selectedIntent?: string;
  timestamp: string;
  currentPage?: string;
  userIntent?: string;
  searchQuery?: string;
}

export class LocalStorageService {
  // Profile completion state
  private static readonly PROFILE_COMPLETION_KEY = 'profileCompletionState';
  private static readonly PROFILE_SETUP_COMPLETED_KEY = 'profileSetupCompleted';
  
  // Nicole context
  private static readonly NICOLE_CONTEXT_KEY = 'nicoleContext';
  
  // Deprecated keys to clean up
  private static readonly DEPRECATED_KEYS = [
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

  // Profile completion methods
  static getProfileCompletionState(): ProfileCompletionState | null {
    try {
      const state = localStorage.getItem(this.PROFILE_COMPLETION_KEY);
      return state ? JSON.parse(state) : null;
    } catch (error) {
      console.error('Error reading profile completion state:', error);
      return null;
    }
  }

  static setProfileCompletionState(state: Partial<ProfileCompletionState>): void {
    try {
      const current = this.getProfileCompletionState() || {} as ProfileCompletionState;
      const updated = { ...current, ...state };
      localStorage.setItem(this.PROFILE_COMPLETION_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving profile completion state:', error);
    }
  }

  static clearProfileCompletionState(): void {
    localStorage.removeItem(this.PROFILE_COMPLETION_KEY);
  }

  static isProfileSetupCompleted(): boolean {
    return localStorage.getItem(this.PROFILE_SETUP_COMPLETED_KEY) === 'true';
  }

  static markProfileSetupCompleted(): void {
    localStorage.setItem(this.PROFILE_SETUP_COMPLETED_KEY, 'true');
    this.clearProfileCompletionState();
  }

  // Nicole context methods
  static getNicoleContext(): NicoleContext | null {
    try {
      const context = localStorage.getItem(this.NICOLE_CONTEXT_KEY);
      return context ? JSON.parse(context) : null;
    } catch (error) {
      console.error('Error reading Nicole context:', error);
      return null;
    }
  }

  static setNicoleContext(context: Partial<NicoleContext>): void {
    try {
      const current = this.getNicoleContext() || {} as NicoleContext;
      const updated = { ...current, ...context, timestamp: new Date().toISOString() };
      localStorage.setItem(this.NICOLE_CONTEXT_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving Nicole context:', error);
    }
  }

  static clearNicoleContext(): void {
    localStorage.removeItem(this.NICOLE_CONTEXT_KEY);
  }

  // Cleanup methods
  static cleanupDeprecatedKeys(): void {
    console.log('Cleaning up deprecated localStorage keys...');
    this.DEPRECATED_KEYS.forEach(key => {
      if (localStorage.getItem(key)) {
        console.log(`Removing deprecated key: ${key}`);
        localStorage.removeItem(key);
      }
    });
  }

  // Migration helper
  static migrateFromDeprecatedKeys(): ProfileCompletionState | null {
    console.log('Migrating from deprecated localStorage keys...');
    
    // Check if we have any old data to migrate
    const userIntent = localStorage.getItem('userIntent');
    const newSignUp = localStorage.getItem('newSignUp');
    const pendingEmail = localStorage.getItem('pendingVerificationEmail');
    const pendingName = localStorage.getItem('pendingVerificationName');
    const pendingProfileData = localStorage.getItem('pendingProfileData');
    
    if (!userIntent && !newSignUp && !pendingEmail && !pendingProfileData) {
      return null; // Nothing to migrate
    }

    try {
      const migrationState: Partial<ProfileCompletionState> = {
        step: 'signup',
        source: 'email'
      };

      if (pendingEmail) {
        migrationState.email = pendingEmail;
      }

      if (pendingName) {
        migrationState.firstName = pendingName.split(' ')[0] || '';
        migrationState.lastName = pendingName.split(' ').slice(1).join(' ') || '';
      }

      if (pendingProfileData) {
        try {
          const profileData = JSON.parse(pendingProfileData);
          Object.assign(migrationState, {
            firstName: profileData.firstName,
            lastName: profileData.lastName,
            email: profileData.email,
            photo: profileData.photo,
            username: profileData.username,
            address: profileData.address,
            dateOfBirth: profileData.dateOfBirth ? new Date(profileData.dateOfBirth) : undefined,
            birthYear: profileData.birthYear
          });
        } catch (e) {
          console.warn('Failed to parse pendingProfileData:', e);
        }
      }

      if (userIntent) {
        migrationState.step = 'intent';
      } else if (newSignUp === 'true') {
        migrationState.step = 'profile';
      }

      this.setProfileCompletionState(migrationState);
      console.log('Migration completed:', migrationState);
      
      return migrationState as ProfileCompletionState;
    } catch (error) {
      console.error('Migration failed:', error);
      return null;
    }
  }

  // Initialize the service (run this on app start)
  static initialize(): void {
    console.log('Initializing LocalStorageService...');
    
    // Migrate old data if needed
    const existingState = this.getProfileCompletionState();
    if (!existingState) {
      this.migrateFromDeprecatedKeys();
    }
    
    // Clean up deprecated keys
    this.cleanupDeprecatedKeys();
    
    console.log('LocalStorageService initialized');
  }
}