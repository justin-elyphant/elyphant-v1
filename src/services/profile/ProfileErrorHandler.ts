/**
 * Enhanced error handling utilities for profile operations
 * Provides retry mechanisms, fallback flows, and user-friendly guidance
 */

export interface RetryOptions {
  maxRetries: number;
  retryDelay: number;
  exponentialBackoff: boolean;
}

export interface ErrorRecoveryOptions {
  showUserGuidance: boolean;
  fallbackToBasicFlow: boolean;
  skipNonEssential: boolean;
}

export class ProfileErrorHandler {
  private static readonly DEFAULT_RETRY_OPTIONS: RetryOptions = {
    maxRetries: 3,
    retryDelay: 1000,
    exponentialBackoff: true
  };

  private static readonly DEFAULT_RECOVERY_OPTIONS: ErrorRecoveryOptions = {
    showUserGuidance: true,
    fallbackToBasicFlow: true,
    skipNonEssential: false
  };

  /**
   * Execute an operation with retry logic
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    options: Partial<RetryOptions> = {}
  ): Promise<T> {
    const opts = { ...this.DEFAULT_RETRY_OPTIONS, ...options };
    let lastError: Error;

    for (let attempt = 1; attempt <= opts.maxRetries; attempt++) {
      try {
        console.log(`Attempt ${attempt}/${opts.maxRetries} for operation`);
        return await operation();
      } catch (error: any) {
        lastError = error;
        console.error(`Attempt ${attempt} failed:`, error);

        if (attempt < opts.maxRetries) {
          const delay = opts.exponentialBackoff 
            ? opts.retryDelay * Math.pow(2, attempt - 1)
            : opts.retryDelay;
          
          console.log(`Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  }

  /**
   * Handle OAuth completion errors with fallback flows
   */
  static async handleOAuthError(
    error: Error,
    userId: string,
    partialData: any,
    options: Partial<ErrorRecoveryOptions> = {}
  ): Promise<{ success: boolean; fallbackUsed: boolean; message: string }> {
    const opts = { ...this.DEFAULT_RECOVERY_OPTIONS, ...options };
    
    console.error('OAuth completion error:', error);

    if (opts.fallbackToBasicFlow) {
      try {
        console.log('Attempting fallback flow...');
        
        // Create a minimal profile with available data
        const minimalData = this.extractMinimalProfileData(partialData);
        
        if (this.validateMinimalData(minimalData)) {
          // Try a simpler profile creation without full validation
          const { unifiedProfileService } = await import('@/services/profiles/UnifiedProfileService');
          const result = await unifiedProfileService.createEnhancedProfile(userId, minimalData);
          
          if (result.success) {
            return {
              success: true,
              fallbackUsed: true,
              message: 'Profile created with minimal data. You can complete remaining fields in settings.'
            };
          }
        }
      } catch (fallbackError) {
        console.error('Fallback flow also failed:', fallbackError);
      }
    }

    return {
      success: false,
      fallbackUsed: opts.fallbackToBasicFlow,
      message: this.getUserFriendlyErrorMessage(error)
    };
  }

  /**
   * Handle profile image upload errors with retry and fallback
   */
  static async handleImageUploadError(
    error: Error,
    file: File,
    userId: string
  ): Promise<{ success: boolean; url?: string; message: string }> {
    console.error('Image upload error:', error);

    // Try to retry image upload with different parameters
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Retry with lower quality if file is too large
      if (error.message.includes('size') && file.size > 1024 * 1024) {
        console.log('Attempting image compression...');
        const compressedFile = await this.compressImage(file);
        
        const fileName = `profile-${Date.now()}.jpg`;
        const filePath = `profile-images/${userId}/${fileName}`;
        
        const { data, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, compressedFile, {
            cacheControl: '3600',
            upsert: true
          });

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

          return {
            success: true,
            url: publicUrlData.publicUrl,
            message: 'Image uploaded after compression'
          };
        }
      }
    } catch (retryError) {
      console.error('Image retry failed:', retryError);
    }

    return {
      success: false,
      message: 'Profile creation can continue without a photo. You can add one later in settings.'
    };
  }

  /**
   * Extract minimal required data for profile creation
   */
  private static extractMinimalProfileData(data: any): any {
    return {
      firstName: data.firstName || data.first_name || 'User',
      lastName: data.lastName || data.last_name || '',
      email: data.email || 'unknown@example.com',
      username: data.username || `user_${Date.now()}`,
      photo: null, // Skip photo for minimal profile
      dateOfBirth: data.dateOfBirth || new Date('2000-01-01'),
      birthYear: data.birthYear || 2000,
      address: data.address || 'Not provided'
    };
  }

  /**
   * Validate minimal data requirements
   */
  private static validateMinimalData(data: any): boolean {
    return !!(data.firstName && data.email && data.username);
  }

  /**
   * Simple image compression for retry attempts
   */
  private static async compressImage(file: File): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        // Reduce dimensions
        const maxSize = 800;
        let { width, height } = img;
        
        if (width > height && width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        } else if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], file.name, { 
              type: 'image/jpeg',
              lastModified: Date.now()
            }));
          } else {
            resolve(file); // Fallback to original
          }
        }, 'image/jpeg', 0.7);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Convert technical errors to user-friendly messages
   */
  private static getUserFriendlyErrorMessage(error: Error): string {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'Network connection issue. Please check your internet and try again.';
    }
    
    if (message.includes('timeout')) {
      return 'The operation took too long. Please try again.';
    }
    
    if (message.includes('validation') || message.includes('required')) {
      return 'Some required information is missing. Please check all fields.';
    }
    
    if (message.includes('unauthorized') || message.includes('permission')) {
      return 'Authentication issue. Please refresh the page and try again.';
    }
    
    if (message.includes('storage') || message.includes('upload')) {
      return 'File upload failed. You can continue without a photo and add one later.';
    }
    
    return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
  }

  /**
   * Create repair utilities for incomplete profiles
   */
  static createProfileRepairFlow(profile: any): {
    missingFields: string[];
    repairActions: Array<{ field: string; action: string; priority: number }>;
    canProceed: boolean;
  } {
    const requiredFields = ['first_name', 'last_name', 'email', 'username', 'profile_image', 'birth_year'];
    const missingFields: string[] = [];
    const repairActions: Array<{ field: string; action: string; priority: number }> = [];

    requiredFields.forEach(field => {
      const value = profile[field];
      const isEmpty = !value || (typeof value === 'string' && value.trim() === '');
      
      if (isEmpty) {
        missingFields.push(field);
        repairActions.push({
          field,
          action: this.getRepairAction(field),
          priority: this.getFieldPriority(field)
        });
      }
    });

    // Sort by priority (higher number = higher priority)
    repairActions.sort((a, b) => b.priority - a.priority);

    return {
      missingFields,
      repairActions,
      canProceed: missingFields.length === 0
    };
  }

  private static getRepairAction(field: string): string {
    const actions: Record<string, string> = {
      first_name: 'Enter your first name in settings',
      last_name: 'Enter your last name in settings',
      email: 'Update your email address',
      username: 'Choose a unique username',
      profile_image: 'Upload a profile photo',
      birth_year: 'Enter your birth year for better recommendations'
    };
    return actions[field] || `Complete ${field} field`;
  }

  private static getFieldPriority(field: string): number {
    const priorities: Record<string, number> = {
      first_name: 10,
      last_name: 9,
      email: 8,
      username: 7,
      profile_image: 6,
      birth_year: 5
    };
    return priorities[field] || 1;
  }
}