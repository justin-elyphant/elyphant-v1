
import React, { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SignUpFormComponent from "../signup/SignUpForm";
import { SignUpFormValues } from "../signup/SignUpForm";

const SignUpForm = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignUp = useCallback(async (values: SignUpFormValues) => {
    setIsSubmitting(true);
    try {
      console.log("📝 Starting simple signup with:", { name: values.name, email: values.email });
      
      const redirectUrl = `${window.location.origin}/profile-setup`;
      
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            name: values.name,
            first_name: values.name.split(' ')[0] || '',
            last_name: values.name.split(' ').slice(1).join(' ') || ''
          },
          emailRedirectTo: redirectUrl
        }
      });
      
      if (error) {
        console.error("❌ Signup error:", error);
        throw error;
      }
      
      if (data.user) {
        console.log("✅ Account created successfully! Redirecting to profile setup...");
        toast.success("Account created! Complete your profile to get started.");
        
        // Immediate redirect to profile setup
        navigate("/profile-setup", { replace: true });
      }
    } catch (error: any) {
      console.error("❌ Simple signup failed:", error);
      toast.error(error.message || "Failed to create account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [navigate]);

  return (
    <SignUpFormComponent 
      onSubmit={handleSignUp}
      isSubmitting={isSubmitting}
    />
  );
};

export default SignUpForm;
