
import React, { useEffect } from "react";
import { useSignUpProcess } from "@/hooks/auth";
import SignUpContentWrapper from "@/components/auth/signup/SignUpContentWrapper";
import Header from "@/components/home/Header";
import Footer from "@/components/home/Footer";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Info, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const {
    step,
    userEmail,
    userName,
    resendCount,
    testVerificationCode,
    onSignUpSubmit,
    handleResendVerification,
    handleBackToSignUp,
    isSubmitting,
    bypassVerification,
  } = useSignUpProcess();
  
  // Verify Supabase connection on page load
  const [isSupabaseConnected, setIsSupabaseConnected] = React.useState<boolean | null>(null);
  const [connectionError, setConnectionError] = React.useState<string | null>(null);
  const [rateLimitReached, setRateLimitReached] = React.useState<boolean>(
    localStorage.getItem("signupRateLimited") === "true"
  );
  
  useEffect(() => {
    const checkSupabaseConnection = async () => {
      try {
        // Simple test query to verify connection
        const { data, error } = await supabase.from('profiles').select('id').limit(1);
        
        if (error) {
          console.error("Supabase connection error:", error);
          setConnectionError(error.message);
          setIsSupabaseConnected(false);
        } else {
          console.log("Successfully connected to Supabase:", data);
          setIsSupabaseConnected(true);
        }
      } catch (err) {
        console.error("Error checking Supabase connection:", err);
        setConnectionError(err instanceof Error ? err.message : "Unknown error");
        setIsSupabaseConnected(false);
      }
    };
    
    checkSupabaseConnection();
  }, []);
  
  // Auto-redirect if rate limited
  useEffect(() => {
    if (localStorage.getItem("signupRateLimited") === "true" && 
        localStorage.getItem("userEmail") && 
        localStorage.getItem("userName")) {
      console.log("Rate limit detected and user info available, redirecting to profile setup");
      navigate('/profile-setup', { replace: true });
    }
  }, [navigate]);
  
  // Enhanced logging to check testVerificationCode value
  useEffect(() => {
    console.log("SignUp page - Full state:", {
      step,
      userEmail,
      userName,
      resendCount,
      testVerificationCode: testVerificationCode || "none",
      isSubmitting,
      bypassVerification,
      supabaseConnection: isSupabaseConnected,
      rateLimitReached
    });
  }, [step, userEmail, userName, resendCount, testVerificationCode, isSubmitting, bypassVerification, isSupabaseConnected, rateLimitReached]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="container max-w-md mx-auto py-10 px-4 flex-grow">
        {isSupabaseConnected === true && (
          <Alert variant="success" className="mb-4 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              Successfully connected to Supabase! Ready to test user registration.
            </AlertDescription>
          </Alert>
        )}
        
        {isSupabaseConnected === false && (
          <Alert variant="destructive" className="mb-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Connection to Supabase failed: {connectionError || "Unknown error"}
            </AlertDescription>
          </Alert>
        )}
        
        {rateLimitReached && (
          <Alert className="mb-4 bg-yellow-50 border-yellow-200">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-700">
              Rate limit for signup emails reached. We've simplified your signup experience - you'll be redirected to profile setup after account creation.
            </AlertDescription>
          </Alert>
        )}
        
        {(localStorage.getItem("signupRateLimited") === "true" || bypassVerification) && (
          <Alert variant="success" className="mb-4 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              We've simplified your signup experience! You can proceed directly to profile setup.
            </AlertDescription>
          </Alert>
        )}
        
        <SignUpContentWrapper
          step={step as "signup" | "verification"}
          userEmail={userEmail}
          userName={userName || ""}
          resendCount={resendCount || 0}
          testVerificationCode={testVerificationCode}
          onSignUpSubmit={onSignUpSubmit}
          handleResendVerification={handleResendVerification}
          handleBackToSignUp={handleBackToSignUp}
          isSubmitting={isSubmitting}
          bypassVerification={bypassVerification}
        />
      </div>
      <Footer />
    </div>
  );
};

export default SignUp;
