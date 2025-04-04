
import React, { useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock, User, Facebook, Apple } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import InputField from "./fields/InputField";
import { CaptchaField } from "./fields/CaptchaField";
import { supabase } from "@/integrations/supabase/client";
import { FcGoogle } from "react-icons/fc";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

// Schema definition
const signUpSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  captcha: z.string().min(1, { message: "Please enter the captcha code" }),
});

export type SignUpValues = z.infer<typeof signUpSchema>;

interface SignUpFormProps {
  onSubmitSuccess: (values: SignUpValues) => void;
}

const SignUpForm = ({ onSubmitSuccess }: SignUpFormProps) => {
  const captchaRef = useRef<any>(null);
  const [isLoading, setIsLoading] = React.useState<{[key: string]: boolean}>({
    email: false,
    google: false,
    apple: false,
    facebook: false
  });
  
  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      captcha: "",
    },
  });

  const onSubmit = (values: SignUpValues) => {
    // Validate the captcha - the field component handles the validation internally
    // by comparing user input to the generated captcha
    const captchaField = document.querySelector(".CaptchaField") as HTMLElement;
    if (captchaField && captchaField.querySelector(".text-destructive")) {
      return;
    }
    
    // Call the parent component's callback
    onSubmitSuccess(values);
  };

  const handleSocialLogin = async (provider: 'google' | 'apple' | 'facebook') => {
    try {
      setIsLoading({ ...isLoading, [provider]: true });
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: provider === 'facebook' ? {
            access_type: 'offline',
            scope: 'email,public_profile,user_friends'
          } : undefined
        }
      });
      
      if (error) {
        toast.error(`${provider} sign-in failed`, {
          description: error.message,
        });
      }
    } catch (err) {
      console.error(`${provider} sign-in error:`, err);
      toast.error(`Failed to sign in with ${provider}`);
    } finally {
      setIsLoading({ ...isLoading, [provider]: false });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

        <div className="CaptchaField">
          <CaptchaField form={form} />
        </div>

        <Button 
          type="submit" 
          className="w-full bg-purple-600 hover:bg-purple-700"
          disabled={isLoading.email}
        >
          {isLoading.email ? "Creating Account..." : "Create Account"}
        </Button>
        
        <div className="relative my-6">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-xs text-muted-foreground">
            OR CONTINUE WITH
          </span>
        </div>
        
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => handleSocialLogin('google')}
            disabled={isLoading.google}
            className="flex items-center justify-center gap-2"
          >
            <FcGoogle className="h-5 w-5" />
            <span className="sr-only sm:not-sr-only sm:inline-block">Google</span>
          </Button>
          
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => handleSocialLogin('apple')}
            disabled={isLoading.apple}
            className="flex items-center justify-center gap-2"
          >
            <Apple className="h-5 w-5" />
            <span className="sr-only sm:not-sr-only sm:inline-block">Apple</span>
          </Button>
          
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => handleSocialLogin('facebook')}
            disabled={isLoading.facebook}
            className="flex items-center justify-center gap-2"
          >
            <Facebook className="h-5 w-5 text-blue-600" />
            <span className="sr-only sm:not-sr-only sm:inline-block">Facebook</span>
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default SignUpForm;
