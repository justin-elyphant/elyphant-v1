
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import SimpleProfileForm from "@/components/profile-setup/SimpleProfileForm";
import QuickInterestsModal from "@/components/auth/QuickInterestsModal";

const StreamlinedProfileSetup = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const [showInterestsModal, setShowInterestsModal] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
      return;
    }
  }, [user, isLoading, navigate]);

  const handleProfileComplete = () => {
    console.log("✅ Profile completed! Checking if interests modal should be shown...");
    
    // Check if this is a new signup that should see interests modal
    const isNewSignUp = localStorage.getItem("newSignUp") === "true";
    
    if (isNewSignUp) {
      console.log("🎯 New signup detected, showing interests modal");
      setShowInterestsModal(true);
    } else {
      console.log("📍 Existing user, redirecting directly to gifting");
      navigate('/gifting', { replace: true });
    }
  };

  const handleInterestsComplete = () => {
    console.log("✅ Interests completed! Cleaning up and redirecting to gifting...");
    
    // Clean up signup flags
    localStorage.removeItem("newSignUp");
    localStorage.removeItem("profileCompletionState");
    
    setShowInterestsModal(false);
    navigate('/gifting', { replace: true });
  };

  const handleInterestsClose = () => {
    console.log("⏭️ Interests modal closed/skipped");
    handleInterestsComplete();
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container max-w-md mx-auto py-10 px-4 flex-grow flex items-center justify-center">
        <div className="w-full">
          <Card className="w-full">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold">Complete Your Profile</h2>
                <p className="text-sm text-muted-foreground mt-2">
                  Add your photo, birthday, and shipping address to get started
                </p>
              </div>
              
              <SimpleProfileForm onComplete={handleProfileComplete} />
            </CardContent>
          </Card>
        </div>
      </div>

      <QuickInterestsModal
        isOpen={showInterestsModal}
        onClose={handleInterestsClose}
        onComplete={handleInterestsComplete}
        userData={user ? {
          userId: user.id,
          userEmail: user.email || '',
          userFirstName: user.user_metadata?.first_name || user.user_metadata?.name?.split(' ')[0] || '',
          userLastName: user.user_metadata?.last_name || user.user_metadata?.name?.split(' ').slice(1).join(' ') || undefined,
          birthYear: undefined // Will be available after profile completion
        } : undefined}
      />
    </MainLayout>
  );
};

export default StreamlinedProfileSetup;
