
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import EnhancedAuthModal from "@/components/auth/enhanced/EnhancedAuthModal";

const AuthButtons = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"signin" | "signup">("signup");

  // Debug modal state changes
  React.useEffect(() => {
    console.log("🏠 AuthButtons: isModalOpen =", isModalOpen);
  }, [isModalOpen]);

  const handleModalClose = () => {
    console.log("🏠 AuthButtons: handleModalClose called");
    console.trace("AuthButtons modal close trace:");
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
