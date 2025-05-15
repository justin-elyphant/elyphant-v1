import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import Header from "@/components/home/Header";
import SignInView from "@/components/auth/signin/views/SignInView"; // Import SignInView
import Footer from "@/components/home/Footer"; // Import Footer

const SignIn = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  React.useEffect(() => {
    console.log('SignIn.tsx Effect: user, isLoading', { user, isLoading });
    if (!isLoading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, isLoading, navigate]);

  const handleSignInSuccess = () => {
    console.log("Sign in successful, awaiting user state update for redirect");
    // useEffect above manages redirect
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <div className="container max-w-md mx-auto py-10 px-4 flex-grow flex items-center justify-center">
        <SignInView onSignInSuccess={handleSignInSuccess} />
      </div>
      <Footer />
    </div>
  );
};
export default SignIn;
