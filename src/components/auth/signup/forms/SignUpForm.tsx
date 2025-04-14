
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock, User, Loader2 } from "lucide-react";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import InputField from "../fields/InputField";
import { CaptchaField } from "../fields/CaptchaField";
import { toast } from "sonner";

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
  isSubmitting?: boolean;
}

const SignUpForm: React.FC<SignUpFormProps> = ({ 
  onSubmit, 
  isSubmitting = false 
}) => {
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
    try {
      // Validate the captcha - the field component handles the validation internally
      const captchaField = document.querySelector(".CaptchaField") as HTMLElement;
      if (captchaField && captchaField.querySelector(".text-destructive")) {
        return;
      }
      
      // Call the parent onSubmit with error handling
      await onSubmit(values);
    } catch (error: any) {
      // Specific handling for rate limit errors
      if (error.message?.includes("rate limit") || 
          error.message?.includes("too many requests")) {
        toast.error("Too many signup attempts", {
          description: "Please wait a few minutes before trying again."
        });
      } else {
        // Generic error handling
        toast.error("Signup failed", {
          description: error.message || "An unexpected error occurred"
        });
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <InputField
          form={form}
          name="name"
          label="Name"
          placeholder="Your name"
          icon={User}
        />
        
        <InputField
          form={form}
          name="email"
          label="Email"
          placeholder="your@email.com"
          type="email"
          icon={Mail}
        />
        
        <InputField
          form={form}
          name="password"
          label="Password"
          placeholder="********"
          type="password"
          icon={Lock}
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
