import { z, ZodSchema } from "zod";
import { toast } from "sonner";
import { formSchema } from "@/hooks/settings/settingsFormSchema";
import { ValidationRule } from "@/hooks/common/dataConsistency/types";
import { 
  createProfileCompletenessRule,
  createWishlistConsistencyRule,
  createConnectionConsistencyRule,
  createAutoGiftRulesValidityRule
} from "@/hooks/common/dataConsistency/validationRules";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedData?: any;
  warnings?: string[];
}

export interface ValidationContext {
  userId?: string;
  dataType: string;
  operation: 'create' | 'update' | 'delete';
  skipOptional?: boolean;
}

export class UnifiedDataValidationService {
  private static instance: UnifiedDataValidationService;
  private validationSchemas: Map<string, ZodSchema> = new Map();
  private validationRules: Map<string, ValidationRule[]> = new Map();
  private autoFixRegistry: Map<string, () => Promise<void>> = new Map();

  private constructor() {
    this.initializeSchemas();
  }

  static getInstance(): UnifiedDataValidationService {
    if (!this.instance) {
      this.instance = new UnifiedDataValidationService();
    }
    return this.instance;
  }

  private initializeSchemas(): void {
    // Register all validation schemas
    this.validationSchemas.set('settings', formSchema);
    
    // Profile validation schema (consolidated from deprecated useProfileValidation)
    const profileSchema = z.object({
      name: z.string().min(2, "Name must be at least 2 characters"),
      email: z.string().email("Valid email is required"),
      birth_year: z.number().min(1900).max(new Date().getFullYear()).optional(),
      shipping_address: z.object({
        address_line1: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zip_code: z.string().optional(),
        country: z.string().optional()
      }).optional()
    });
    this.validationSchemas.set('profile', profileSchema);
    
    // Step-specific schemas for profile setup
    this.validationSchemas.set('profile-basic', z.object({
      name: z.string().min(2, "Name must be at least 2 characters"),
      email: z.string().email("Valid email is required")
    }));
    
    this.validationSchemas.set('profile-address', z.object({
      address: z.object({
        city: z.string().min(1, "City is required"),
        country: z.string().min(1, "Country is required")
      })
    }));
    
    this.validationSchemas.set('profile-interests', z.object({
      interests: z.array(z.string()).min(1, "At least one interest is required")
    }));
    
    this.validationSchemas.set('profile-privacy', z.object({
      data_sharing_settings: z.object({
        dob: z.enum(["private", "friends", "public"]),
        shipping_address: z.enum(["private", "friends", "public"]),
        gift_preferences: z.enum(["private", "friends", "public"]),
        email: z.enum(["private", "friends", "public"])
      })
    }));
  }

  /**
   * Validate data against registered schema
   */
  validateData(data: any, context: ValidationContext): ValidationResult {
    const { dataType, operation, skipOptional = false } = context;
    
    try {
      const schema = this.validationSchemas.get(dataType);
      if (!schema) {
        return {
          isValid: false,
          errors: [`No validation schema found for data type: ${dataType}`]
        };
      }

      // Apply schema validation
      const result = schema.safeParse(data);
      
      if (!result.success) {
        const errors = result.error.errors.map(err => 
          `${err.path.join('.')}: ${err.message}`
        );
        
        return {
          isValid: false,
          errors,
          warnings: []
        };
      }

      return {
        isValid: true,
        errors: [],
        sanitizedData: result.data,
        warnings: []
      };
    } catch (error) {
      console.error('Validation error:', error);
      return {
        isValid: false,
        errors: ['Validation process failed'],
        warnings: []
      };
    }
  }

  /**
   * Validate profile step data
   */
  validateProfileStep(step: number, data: any): ValidationResult {
    const stepSchemas = {
      0: 'profile-basic',
      1: 'profile-birthday', // Optional during onboarding
      2: 'profile-address',
      3: 'profile-interests',
      4: 'profile-privacy',
      5: 'profile-next-steps' // Always valid
    };

    const schemaType = stepSchemas[step as keyof typeof stepSchemas];
    
    if (!schemaType) {
      return { isValid: false, errors: [`Invalid step: ${step}`] };
    }

    if (step === 1 || step === 5) {
      // Optional steps
      return { isValid: true, errors: [], sanitizedData: data };
    }

    return this.validateData(data, {
      dataType: schemaType,
      operation: 'create'
    });
  }

  /**
   * Run data consistency validation rules
   */
  async validateDataConsistency(userId: string, showToasts = false): Promise<ValidationResult> {
    const rules = [
      createProfileCompletenessRule(userId),
      createWishlistConsistencyRule(userId),
      createConnectionConsistencyRule(userId),
      createAutoGiftRulesValidityRule(userId)
    ];

    const errors: string[] = [];
    const warnings: string[] = [];

    for (const rule of rules) {
      try {
        const isValid = await rule.check();
        if (!isValid) {
          errors.push(rule.message);
          
          if (showToasts) {
            toast.warning(rule.message, {
              action: rule.autoFix ? {
                label: "Fix",
                onClick: () => rule.autoFix!()
              } : undefined
            });
          }
        }
      } catch (error) {
        console.error(`Validation rule ${rule.name} failed:`, error);
        warnings.push(`Validation error: ${rule.name}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedData: null
    };
  }

  /**
   * Auto-fix data consistency issues
   */
  async autoFixDataIssues(userId: string): Promise<ValidationResult> {
    const rules = [
      createProfileCompletenessRule(userId),
      createWishlistConsistencyRule(userId),
      createConnectionConsistencyRule(userId),
      createAutoGiftRulesValidityRule(userId)
    ];

    const fixedIssues: string[] = [];
    const errors: string[] = [];

    for (const rule of rules) {
      if (rule.autoFix) {
        try {
          const isValid = await rule.check();
          if (!isValid) {
            await rule.autoFix();
            fixedIssues.push(`Fixed: ${rule.name}`);
          }
        } catch (error) {
          console.error(`Auto-fix failed for ${rule.name}:`, error);
          errors.push(`Failed to fix: ${rule.name}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: fixedIssues
    };
  }

  /**
   * Register custom validation schema
   */
  registerSchema(dataType: string, schema: ZodSchema): void {
    this.validationSchemas.set(dataType, schema);
  }

  /**
   * Register custom validation rule
   */
  registerValidationRule(dataType: string, rule: ValidationRule): void {
    const existing = this.validationRules.get(dataType) || [];
    this.validationRules.set(dataType, [...existing, rule]);
  }

  /**
   * Get all validation errors for display
   */
  getValidationSummary(userId: string): Promise<ValidationResult> {
    return this.validateDataConsistency(userId, false);
  }
}

export const unifiedDataValidationService = UnifiedDataValidationService.getInstance();