
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock, User, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { loadCaptchaEnginge, LoadCanvasTemplate, validateCaptcha } from "react-simple-captcha";

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
  const [captchaError, setCaptchaError] = useState("");
  
  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      captcha: "",
    },
  });

  useEffect(() => {
    // Load the captcha engine when the component mounts
    loadCaptchaEnginge(6);
  }, []);

  const refreshCaptcha = () => {
    loadCaptchaEnginge(6);
    setCaptchaError("");
    form.setValue("captcha", "");
  };

  const onSubmit = (values: SignUpValues) => {
    // Validate the captcha
    if (!validateCaptcha(values.captcha)) {
      setCaptchaError("The captcha you entered is incorrect");
      return;
    }

    // Reset any captcha error
    setCaptchaError("");
    
    // Call the parent component's callback
    onSubmitSuccess(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input placeholder="Your name" className="pl-10" {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input type="email" placeholder="your@email.com" className="pl-10" {...field} />
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
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input type="password" placeholder="********" className="pl-10" {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Captcha Field */}
        <div className="space-y-2">
          <div className="relative bg-gray-50 p-3 rounded-md border">
            <LoadCanvasTemplate />
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              className="absolute top-3 right-3 h-8 w-8"
              onClick={refreshCaptcha}
            >
              <RefreshCw className="h-4 w-4" />
              <span className="sr-only">Refresh Captcha</span>
            </Button>
          </div>
          
          <FormField
            control={form.control}
            name="captcha"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Captcha</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter the code shown above" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {captchaError && (
            <p className="text-sm font-medium text-destructive">{captchaError}</p>
          )}
        </div>
        
        <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">
          Create Account
        </Button>
      </form>
    </Form>
  );
};

export default SignUpForm;
