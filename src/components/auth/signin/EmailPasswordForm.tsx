
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock, Loader2 } from "lucide-react";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

const signInSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type SignInValues = z.infer<typeof signInSchema>;

interface EmailPasswordFormProps {
  onSuccess: () => void;
}

export function EmailPasswordForm({ onSuccess }: EmailPasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: SignInValues) => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      
      console.log("Attempting to sign in with email:", values.email);
      
      // Try to sign in the user
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });
      
      if (error) {
        console.error("Sign in error:", error);
        
        // Handle specific error cases
        if (error.message.includes("Invalid login credentials")) {
          // Check if the email exists but password is wrong
          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', values.email)
            .maybeSingle();
          
          if (!userError && userData) {
            setErrorMessage("The password you entered is incorrect.");
          } else {
            setErrorMessage("Email not found. Please sign up first.");
          }
        } else {
          setErrorMessage(error.message);
        }
        return;
      }
      
      if (!data.user) {
        setErrorMessage("No user found. Please sign up first.");
        return;
      }
      
      console.log("Sign in successful, redirecting...");
      
      // Set localStorage flag for triggering profile creation if needed
      localStorage.setItem("fromSignIn", "true");
      
      // Notify and redirect
      toast.success("Signed in successfully!");
      onSuccess();
    } catch (err: any) {
      console.error("Sign in submission error:", err);
      setErrorMessage(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {errorMessage && (
          <Alert variant="destructive" className="mb-2">
            <Info className="h-4 w-4" />
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
                  <span className="absolute left-3 top-3 text-gray-400">
                    <Mail className="h-4 w-4" />
                  </span>
                  <Input
                    placeholder="your@email.com"
                    className="pl-10"
                    {...field}
                    disabled={isLoading}
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
                  <span className="absolute left-3 top-3 text-gray-400">
                    <Lock className="h-4 w-4" />
                  </span>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    {...field}
                    disabled={isLoading}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
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
