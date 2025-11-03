
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock, Loader2, Info } from "lucide-react";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LocalStorageService } from "@/services/localStorage/LocalStorageService";
import { useAuthWithRateLimit } from "@/hooks/useAuthWithRateLimit";

const signInSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }), // Supabase default min is 6
});

type SignInValues = z.infer<typeof signInSchema>;

interface EmailPasswordFormProps {
  onSuccess: () => void;
}

export function EmailPasswordForm({ onSuccess }: EmailPasswordFormProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { signIn, isLoading: authLoading } = useAuthWithRateLimit();

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: SignInValues) => {
    try {
      setErrorMessage(null);
      
      console.log("Attempting to sign in with email:", values.email);
      
      const { data, error } = await signIn(values.email, values.password);
      
      if (error) {
        console.error("Sign in error:", error);
        
        if (error.message.includes("Invalid login credentials")) {
          setErrorMessage("Invalid email or password.");
        } else if (error.message.includes("Email not confirmed")) {
           setErrorMessage("Please confirm your email address first.");
           toast.info("Email not confirmed", {
             description: "Check your inbox for a confirmation link, or try resending it from the verification page if you just signed up.",
           });
        }
        else {
          setErrorMessage(error.message || "An unexpected error occurred.");
        }
        return;
      }
      
      if (!data.user) {
        // This case should ideally be covered by the error above, but as a fallback:
        setErrorMessage("Sign in failed. Please check your credentials.");
        return;
      }
      
      console.log("Sign in successful, calling onSuccess handler");
      LocalStorageService.setNicoleContext({ 
        source: 'sign_in',
        currentPage: window.location.pathname
      });
      toast.success("Signed in successfully!");
      onSuccess();

    } catch (err: any) {
      console.error("Sign in submission error:", err);
      setErrorMessage(err.message || "An unexpected error occurred");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {errorMessage && (
          <Alert variant="destructive" className="mb-2">
            <Info className="h-4 w-4" /> {/* Using Info icon for consistency */}
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="your@email.com"
                    className="pl-10"
                    {...field}
                    disabled={authLoading}
                    type="email"
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    {...field}
                    disabled={authLoading}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          className="w-full bg-purple-600 hover:bg-purple-700"
          disabled={authLoading}
        >
          {authLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>
    </Form>
  );
}
