
import { Resend } from "npm:resend@2.0.0";

// Initialize Resend with API key from environment variable
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

/**
 * Sleep function for implementing backoff
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Check if error is related to rate limiting
 */
export function isRateLimitError(error: any): boolean {
  return error.message?.includes('429') || 
         error.message?.includes('rate') || 
         error.message?.includes('limit') ||
         error.statusCode === 429;
}

/**
 * Create HTML email content for the verification email
 */
export function createVerificationEmailContent(name: string, verificationCode: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #8a4baf;">Welcome to Elyphant! 🐘</h1>
      </div>
      <p>Hi ${name || "there"},</p>
      <p>Thanks for signing up with Elyphant! We're excited to have you join our community of gift-givers and wish-makers.</p>
      <p>Here is your verification code:</p>
      <div style="margin: 20px 0; text-align: center;">
        <div style="background-color: #f5f5f5; padding: 15px; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #8a4baf;">
          ${verificationCode}
        </div>
      </div>
      <p>Enter this code on the signup page to verify your email address and continue creating your account.</p>
      <p>This code will expire in 15 minutes.</p>
      <p>If you didn't create an account with us, you can safely ignore this email.</p>
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #6b6b6b; font-size: 12px; text-align: center;">
        <p>&copy; ${new Date().getFullYear()} Elyphant. All rights reserved.</p>
      </div>
    </div>
  `;
}

/**
 * Send email with retry logic for handling rate limits
 */
export async function sendEmailWithRetry(
  email: string, 
  name: string, 
  verificationCode: string, 
  maxRetries = 3
): Promise<{success: boolean, data?: any, error?: any}> {
  let retries = 0;
  let lastError = null;
  
  while (retries < maxRetries) {
    try {
      console.log(`Attempt ${retries + 1}/${maxRetries} to send email to ${email}`);
      const emailContent = createVerificationEmailContent(name, verificationCode);
      const emailResponse = await resend.emails.send({
        from: "Elyphant <onboarding@resend.dev>", 
        to: [email],
        subject: "Your Elyphant verification code",
        html: emailContent,
      });
      
      console.log("Email sent successfully:", emailResponse);
      return { success: true, data: emailResponse };
    } catch (error) {
      lastError = error;
      console.error(`Email sending attempt ${retries + 1} failed:`, error);
      
      if (isRateLimitError(error)) {
        const backoffTime = Math.pow(2, retries) * 1000; // Exponential backoff
        console.log(`Rate limit detected. Backing off for ${backoffTime}ms before retry.`);
        await sleep(backoffTime);
        retries++;
      } else {
        // If it's not a rate limit error, don't retry
        break;
      }
    }
  }
  
  return { success: false, error: lastError };
}
