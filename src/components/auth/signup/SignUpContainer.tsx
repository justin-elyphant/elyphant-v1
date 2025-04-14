
import React from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import SignUpForm, { SignUpFormValues } from "@/components/auth/signup/SignUpForm";

interface SignUpContainerProps {
  onSubmitSuccess: (values: SignUpFormValues) => Promise<void>;
}

const SignUpContainer = ({ onSubmitSuccess }: SignUpContainerProps) => {
  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
        <CardDescription>
          Join our community to find perfect gifts and share your wishlist
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SignUpForm onSubmit={onSubmitSuccess} />
      </CardContent>
      <CardFooter className="flex flex-col items-center gap-4">
        <div className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/sign-in" className="text-primary underline-offset-4 hover:underline">
            Sign in
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
};

export default SignUpContainer;
