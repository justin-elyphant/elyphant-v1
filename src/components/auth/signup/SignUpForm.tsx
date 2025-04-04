
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import InputField from "./fields/InputField";
import { CaptchaField } from "./fields/CaptchaField";
import { validateCaptcha } from "react-simple-captcha";

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

        <CaptchaField form={form} />

        <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">
          Create Account
        </Button>
      </form>
    </Form>
  );
};

export default SignUpForm;
