
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import EnhancedAuthModal from "@/components/auth/enhanced/EnhancedAuthModalV2";

const AuthButtons = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"signin" | "signup">("signup");

  // Debug modal state changes and check for localStorage flags
  React.useEffect(() => {
    console.log("🏠 AuthButtons: isModalOpen =", isModalOpen);
    
    // Check for forced modal state from localStorage
    const shouldForceOpen = localStorage.getItem('modalForceOpen') === 'true';
    const inSignupFlow = localStorage.getItem('modalInSignupFlow') === 'true';
    
    if ((shouldForceOpen || inSignupFlow) && !isModalOpen) {
      console.log("🏠 AuthButtons: Force opening modal due to localStorage flags", {
        shouldForceOpen,
        inSignupFlow
      });
      setIsModalOpen(true);
    }
  }, [isModalOpen]);

  // Add signup flow recovery mechanism
  React.useEffect(() => {
    const inSignupFlow = localStorage.getItem('modalInSignupFlow') === 'true';
    const shouldForceOpen = localStorage.getItem('modalForceOpen') === 'true';
    
    if (inSignupFlow || shouldForceOpen) {
      console.log("🏠 AuthButtons: Signup flow detected on mount, ensuring modal is open", {
        inSignupFlow,
        shouldForceOpen,
        currentModalOpen: isModalOpen
      });
      
      if (!isModalOpen) {
        console.log("🏠 AuthButtons: Recovering interrupted signup flow");
        setIsModalOpen(true);
      }
    }
  }, []);

  const handleModalClose = () => {
    console.log("🏠 AuthButtons: handleModalClose called");
    console.trace("AuthButtons modal close trace:");
    
    // Don't close if we have localStorage flags forcing it open or in signup flow
    const shouldForceOpen = localStorage.getItem('modalForceOpen') === 'true';
    const inSignupFlow = localStorage.getItem('modalInSignupFlow') === 'true';
    
    if (shouldForceOpen || inSignupFlow) {
      console.log("🏠 AuthButtons: Preventing modal close due to localStorage flags", {
        shouldForceOpen,
        inSignupFlow
      });
      return;
    }
    
    console.log("🏠 AuthButtons: Modal close allowed - no blocking flags detected");
    setIsModalOpen(false);
  };

  const handleSignIn = () => {
    setModalMode("signin");
    setIsModalOpen(true);
  };

  const handleGetStarted = () => {
    setModalMode("signup");
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleSignIn}
          className="text-gray-600 hover:text-gray-900 font-medium"
        >
          Sign In
        </Button>
        <Button
          size="sm"
          onClick={handleGetStarted}
          className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border-0 font-semibold shadow-md hover:shadow-lg transition-all duration-200"
        >
          Get Started
        </Button>
      </div>

      <EnhancedAuthModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        initialMode={modalMode}
      />
    </>
  );
};

export default AuthButtons;
