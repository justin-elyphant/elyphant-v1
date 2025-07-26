
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import MainLayout from "@/components/layout/MainLayout";
import EnhancedAuthModalV2 from "@/components/auth/enhanced/EnhancedAuthModalV2";

const Auth = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const [modalOpen, setModalOpen] = useState(true);

  useEffect(() => {
    console.log("🚪 Auth page: useEffect triggered", { 
      user: !!user, 
      isLoading,
      modalOpen 
    });

    // Don't redirect if modal is in signup flow - let the modal handle navigation
    const inSignupFlow = localStorage.getItem('modalInSignupFlow') === 'true';
    const modalCurrentStep = localStorage.getItem('modalCurrentStep');
    
    console.log("🚪 Auth page: Flow state", { 
      inSignupFlow, 
      modalCurrentStep 
    });
    
    if (!isLoading && user && !inSignupFlow) {
      console.log("🚪 Auth page: Redirecting authenticated user to dashboard");
      navigate("/dashboard", { replace: true });
    } else if (user && inSignupFlow) {
      console.log("🚀 Auth page: User authenticated but in signup flow - keeping modal open");
      setModalOpen(true);
    }
  }, [user, isLoading, navigate]);

  const handleModalClose = () => {
    console.log("🚪 Auth page: Modal close requested");
    
    // Check if we should prevent closing due to active signup flow
    const inSignupFlow = localStorage.getItem('modalInSignupFlow') === 'true';
    const modalCurrentStep = localStorage.getItem('modalCurrentStep');
    
    if (inSignupFlow && modalCurrentStep && modalCurrentStep !== 'unified-signup') {
      console.log("🚪 Auth page: Preventing modal close due to active signup flow");
      return;
    }
    
    console.log("🚪 Auth page: Closing modal and navigating to homepage");
    setModalOpen(false);
    navigate("/", { replace: true });
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container max-w-md mx-auto py-10 px-4 flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container max-w-md mx-auto py-10 px-4 flex-grow flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Welcome to Elyphant
          </h1>
          <p className="text-muted-foreground">
            Create your account to start your gifting journey
          </p>
        </div>
        
        {/* Use EnhancedAuthModalV2 for the complete onboarding flow */}
        <EnhancedAuthModalV2
          isOpen={modalOpen}
          onClose={handleModalClose}
          defaultStep="unified-signup"
          initialMode="signup"
        />
      </div>
    </MainLayout>
  );
};

export default Auth;
