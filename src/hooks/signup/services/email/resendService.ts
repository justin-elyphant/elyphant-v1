
import { sendVerificationEmail } from "./verificationService";

/**
 * Resend verification email using our custom verification system
 */
export const resendDefaultVerification = async (email: string) => {
  try {
    const currentOrigin = window.location.origin;
    console.log("Resending custom verification for:", email);
    
    const result = await sendVerificationEmail(email, "", currentOrigin);
    return result;
  } catch (error) {
    console.error("Error in resendVerification:", error);
    return { success: false, error };
  }
};
