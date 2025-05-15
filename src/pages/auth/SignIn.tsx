
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import Header from "@/components/home/Header";
import SignInView from "@/components/auth/signin/views/SignInView"; // Import SignInView
import Footer from "@/components/home/Footer"; // Import Footer

const SignIn = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  React.useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const handleSignInSuccess = () => {
    console.log("Sign in successful, awaiting user state update for redirect");
    // The useEffect above will handle the redirect once the user state is updated by AuthProvider
  };

  return (
    <div className="flex flex-col min-h-screen bg-background"> {/* Changed background */}
      <Header />
      {/* Removed the gradient background div, use neutral page background */}
      <div className="container max-w-md mx-auto py-10 px-4 flex-grow flex items-center justify-center">
        {/* Use SignInView for consistent styling */}
        <SignInView onSignInSuccess={handleSignInSuccess} />
      </div>
      <Footer /> {/* Add Footer here */}
    </div>
  );
};

export default SignIn;
