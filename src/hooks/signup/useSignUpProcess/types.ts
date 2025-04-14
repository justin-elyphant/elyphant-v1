
export interface SignUpFormValues {
  name: string;
  email: string;
  password: string;
  captcha: string;
}

export interface UseSignUpProcessReturn {
  step: "signup" | "verification";
  userEmail: string;
  userName: string;
  emailSent: boolean;
  resendCount: number;
  testVerificationCode: string | null;
  onSignUpSubmit: (values: SignUpFormValues) => Promise<void>;
  handleResendVerification: () => Promise<{ success: boolean }>;
  handleBackToSignUp: () => void;
  isSubmitting: boolean;
}
