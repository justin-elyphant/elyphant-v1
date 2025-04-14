
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock, User, Loader2 } from "lucide-react";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import InputField from "../fields/InputField";
import { CaptchaField } from "../fields/CaptchaField";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

// Schema definition
const signUpSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  captcha: z.string().min(1, { message: "Please enter the captcha code" }),
});

export type SignUpFormValues = z.infer<typeof signUpSchema>;

interface SignUpFormProps {
  onSubmit: (values: SignUpFormValues) => Promise<void>;
}

const SignUpForm = ({ onSubmit }: SignUpFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [directSignup, setDirectSignup] = useState(false);
  
  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      captcha: "",
    },
  });

  const handleSubmit = async (values: SignUpFormValues) => {
    // Validate the captcha - the field component handles the validation internally
    const captchaField = document.querySelector(".CaptchaField") as HTMLElement;
    if (captchaField && captchaField.querySelector(".text-destructive")) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      console.log("Submitting signup form with values:", { ...values, password: "[REDACTED]" });
      
      // DIRECT APPROACH: Try to create user directly first
      if (!directSignup) {
        setDirectSignup(true);
        
        console.log("Using direct signup approach to avoid email verification issues");
        
        try {
          // Direct signup approach
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: values.email,
            password: values.password,
            options: {
              data: {
                name: values.name
              }
            }
          });
          
          if (signUpError) {
            console.error("Direct signup error:", signUpError);
            toast.error("Sign up failed", {
              description: signUpError.message
            });
            throw signUpError;
          }
          
          console.log("Direct signup successful:", signUpData);
          
          // Store user data in localStorage for reliability
          if (signUpData.user?.id) {
            localStorage.setItem("userId", signUpData.user.id);
            localStorage.setItem("userEmail", values.email);
            localStorage.setItem("userName", values.name);
            localStorage.setItem("newSignUp", "true");
            
            // Create profile immediately
            try {
              await supabase.functions.invoke('create-profile', {
                body: {
                  user_id: signUpData.user.id,
                  profile_data: {
                    email: values.email,
                    name: values.name,
                    updated_at: new Date().toISOString()
                  }
                }
              });
              
              console.log("Profile created successfully via edge function");
            } catch (profileError) {
              console.error("Error creating profile:", profileError);
            }
            
            toast.success("Account created successfully!");
            
            // Auto sign-in
            const { error: signInError } = await supabase.auth.signInWithPassword({
              email: values.email,
              password: values.password
            });
            
            if (signInError) {
              console.error("Auto sign-in error:", signInError);
            } else {
              console.log("Auto sign-in successful");
            }
          }
          
          // Call the parent onSubmit to continue with the flow
          await onSubmit(values);
          return;
        } catch (err) {
          console.error("Direct signup approach failed:", err);
          // Fall through to regular flow
        }
      }
      
      // Fall back to regular flow if direct approach failed
      await onSubmit(values);
    } catch (error: any) {
      console.error("Form submission error:", error);
      
      if (error.message?.includes("already registered") || error.message?.includes("user_exists")) {
        toast.error("Email already registered", {
          description: "Please try a different email address or sign in."
        });
      } else {
        toast.error("Sign up failed", {
          description: error.message || "Please try again"
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {directSignup && (
          <Alert className="bg-blue-50 border-blue-200 mb-4">
            <Info className="h-4 w-4 text-blue-500 mr-2" />
            <AlertDescription className="text-blue-700">
              Using direct signup mode for faster account creation.
            </AlertDescription>
          </Alert>
        )}
        
        <InputField
          form={form}
          name="name"
          label="Name"
          placeholder="Your name"
          Icon={User}
        />
        
        <InputField
          form={form}
          name="email"
          label="Email"
          placeholder="your@email.com"
          type="email"
          Icon={Mail}
        />
        
        <InputField
          form={form}
          name="password"
          label="Password"
          placeholder="********"
          type="password"
          Icon={Lock}
        />

        <div className="CaptchaField pt-2">
          <CaptchaField form={form} />
        </div>
        
        <Button 
          type="submit" 
          className="w-full bg-purple-600 hover:bg-purple-700"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>
    </Form>
  );
};

export default SignUpForm;
