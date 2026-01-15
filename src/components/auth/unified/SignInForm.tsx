import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { triggerHapticFeedback } from "@/utils/haptics";
const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required")
});
type SignInFormData = z.infer<typeof signInSchema>;
interface SignInFormProps {
  preFilledEmail?: string;
}
const SignInForm: React.FC<SignInFormProps> = ({
  preFilledEmail
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: {
      errors
    }
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: preFilledEmail || ""
    }
  });
  const onSubmit = async (data: SignInFormData) => {
    try {
      setIsLoading(true);
      const {
        data: signInData,
        error
      } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      });
      if (error) {
        triggerHapticFeedback('error');
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Invalid email or password", {
            description: "Please check your credentials and try again."
          });
        } else {
          toast.error("Sign in failed", {
            description: error.message
          });
        }
        return;
      }

      // Check for stored invitation token and link connection for existing users
      const storedToken = sessionStorage.getItem('elyphant_invitation_token');
      if (storedToken && signInData?.user) {
        console.log('🔗 Existing user sign-in: Processing stored invitation token');
        try {
          const { data: rpcResult, error: rpcError } = await supabase.rpc(
            'accept_invitation_by_token' as any,
            {
              p_token: storedToken,
              p_user_id: signInData.user.id
            }
          );
          
          if (rpcError) {
            console.error('❌ Failed to link invitation on sign-in:', rpcError);
          } else if (rpcResult?.linked) {
            console.log('✅ Successfully linked connection for existing user');
            toast.success("Connection linked!", {
              description: "You're now connected with your friend!"
            });
          }
        } catch (linkError) {
          console.error('❌ Error linking invitation:', linkError);
        } finally {
          sessionStorage.removeItem('elyphant_invitation_token');
        }
      }

      triggerHapticFeedback('success');
      toast.success("Welcome back!");
      const redirectPath = searchParams.get('redirect') || '/';
      navigate(redirectPath, {
        replace: true
      });
    } catch (error) {
      console.error("Sign in error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };
  return <div className="space-y-loose">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-standard">
        <div className="space-y-minimal">
          <Label htmlFor="email" className="text-body-sm">Email</Label>
          <Input id="email" type="email" placeholder="Enter your email" {...register("email")} disabled={isLoading} className="touch-target-44" />
          {errors.email && <p className="text-body-sm text-destructive">{errors.email.message}</p>}
        </div>
        
        <div className="space-y-minimal">
          <Label htmlFor="password" className="text-body-sm">Password</Label>
          <PasswordInput id="password" placeholder="Enter your password" {...register("password")} disabled={isLoading} className="touch-target-44" />
          {errors.password && <p className="text-body-sm text-destructive">{errors.password.message}</p>}
        </div>
        
        <motion.div whileTap={{
        scale: 0.97
      }} transition={{
        type: "spring",
        stiffness: 400,
        damping: 25
      }}>
          <Button type="submit" size="touch" className="w-full touch-target-44 touch-manipulation" disabled={isLoading} onClick={() => triggerHapticFeedback('medium')}>
            {isLoading ? <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing In...
              </> : "Sign In"}
          </Button>
        </motion.div>
        
        <div className="text-center">
          <Button variant="link" size="touch" onClick={() => {
          triggerHapticFeedback('light');
          navigate("/forgot-password");
        }} className="text-body-sm text-muted-foreground p-0 touch-target-44 touch-manipulation py-[5px]">
            Forgot your password?
          </Button>
        </div>
      </form>
    </div>;
};
export default SignInForm;