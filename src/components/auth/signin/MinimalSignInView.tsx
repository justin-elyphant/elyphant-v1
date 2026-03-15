import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
  password: z.string().min(1, "Password is required"),
});

type SignInFormData = z.infer<typeof signInSchema>;

interface MinimalSignInViewProps {
  preFilledEmail?: string;
  invitationData?: {
    connectionId: string;
    recipientEmail: string;
    recipientName: string;
    senderName: string;
  } | null;
}

const MinimalSignInView: React.FC<MinimalSignInViewProps> = ({
  preFilledEmail,
  invitationData,
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: preFilledEmail || invitationData?.recipientEmail || "",
    },
  });

  const onSubmit = async (data: SignInFormData) => {
    try {
      setIsLoading(true);
      const { data: signInData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        triggerHapticFeedback("error");
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Invalid email or password", {
            description: "Please check your credentials and try again.",
          });
        } else {
          toast.error("Sign in failed", { description: error.message });
        }
        return;
      }

      // Process stored invitation token for existing users
      const storedToken = sessionStorage.getItem("elyphant_invitation_token");
      if (storedToken && signInData?.user) {
        try {
          const { data: rpcResult, error: rpcError } = await supabase.rpc(
            "accept_invitation_by_token" as any,
            { p_token: storedToken, p_user_id: signInData.user.id }
          );
          if (!rpcError && rpcResult?.linked) {
            toast.success("Connection linked!", {
              description: "You're now connected with your friend!",
            });
          }
        } catch (linkError) {
          console.error("Error linking invitation:", linkError);
        } finally {
          sessionStorage.removeItem("elyphant_invitation_token");
        }
      }

      triggerHapticFeedback("success");
      toast.success("Welcome back!");
      const redirectPath = searchParams.get("redirect") || "/";
      navigate(redirectPath, { replace: true });
    } catch (error) {
      console.error("Sign in error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const switchToSignup = () => {
    triggerHapticFeedback("selection");
    const currentParams = new URLSearchParams(searchParams);
    currentParams.set("mode", "signup");
    navigate(`/auth?${currentParams.toString()}`, { replace: true });
  };

  return (
    <div className="px-6 py-10 md:px-8 md:py-12">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-foreground tracking-tight">
          Welcome Back
        </h2>
        <p className="text-sm text-muted-foreground mt-2">
          {preFilledEmail
            ? "Sign in with your new password"
            : "Sign in to your account"}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="signin-email" className="text-sm font-medium">
            Email
          </Label>
          <Input
            id="signin-email"
            type="email"
            placeholder="you@example.com"
            {...register("email")}
            disabled={isLoading}
            className="h-12"
          />
          {errors.email && (
            <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="signin-password" className="text-sm font-medium">
            Password
          </Label>
          <PasswordInput
            id="signin-password"
            placeholder="Enter your password"
            {...register("password")}
            disabled={isLoading}
          />
          {errors.password && (
            <p className="text-xs text-destructive mt-1">{errors.password.message}</p>
          )}
        </div>

        <motion.div
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <Button
            type="submit"
            className="w-full h-12 text-sm font-semibold bg-foreground text-background hover:bg-foreground/90 rounded-lg touch-manipulation"
            disabled={isLoading}
            onClick={() => triggerHapticFeedback("medium")}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing In...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </motion.div>

        <div className="text-center pt-1">
          <button
            type="button"
            onClick={() => {
              triggerHapticFeedback("light");
              navigate("/forgot-password");
            }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors touch-manipulation"
          >
            Forgot your password?
          </button>
        </div>
      </form>

      {/* Switch to signup */}
      <div className="text-center mt-8 pt-6 border-t border-border">
        <p className="text-sm text-muted-foreground">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={switchToSignup}
            className="font-semibold text-foreground hover:underline touch-manipulation"
          >
            Get Started
          </button>
        </p>
      </div>
    </div>
  );
};

export default MinimalSignInView;
