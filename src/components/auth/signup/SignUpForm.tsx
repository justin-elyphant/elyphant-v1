
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock, User, Loader2 } from "lucide-react";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import InputField from "@/components/auth/signup/fields/InputField";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Simplified schema without captcha
const signUpSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
});

export type SignUpFormValues = z.infer<typeof signUpSchema>;

interface SignUpFormProps {
  onSubmit: (values: SignUpFormValues) => Promise<void>;
  isSubmitting?: boolean;
  invitationData?: {
    connectionId: string;
    recipientEmail: string;
    recipientName: string;
    senderName: string;
  } | null;
}

const SignUpForm: React.FC<SignUpFormProps> = ({ 
  onSubmit, 
  isSubmitting = false,
  invitationData 
}) => {
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: invitationData?.recipientName || "",
      email: invitationData?.recipientEmail || "",
      password: "",
    },
  });

  const handleSubmit = async (values: SignUpFormValues) => {
    try {
      setErrorMessage(null);
      await onSubmit(values);
    } catch (error: any) {
      console.error("Form submission error:", error);
      setErrorMessage(error.message || "An unexpected error occurred");
    }
  };

  return (
    <Form {...form}>
      {invitationData && (
        <div className="mb-4 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
          <div className="flex items-center gap-2 text-purple-900 dark:text-purple-100">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
            <p className="font-medium">
              {invitationData.senderName} invited you to connect!
            </p>
          </div>
          <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
            Complete your signup to accept the invitation and start exchanging perfect gifts.
          </p>
        </div>
      )}
      
      {errorMessage && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <InputField
          form={form}
          name="name"
          label="Name"
          placeholder="Your first and last name"
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
