
import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SignInPromptProps {}

const SignInPrompt: React.FC<SignInPromptProps> = () => (
  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
      <h2 className="text-xl font-semibold mb-2">Sign In Required</h2>
      <p className="text-gray-600 mb-6">
        Please sign in to create and manage your wishlists.
      </p>
      <div className="flex gap-4">
        <Button asChild variant="default">
          <Link to="/auth">Sign In</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/auth">Create Account</Link>
        </Button>
      </div>
    </div>
  </div>
);

export default SignInPrompt;
