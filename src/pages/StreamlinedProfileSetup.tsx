
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import SimpleProfileForm from "@/components/profile-setup/SimpleProfileForm";
import QuickInterestsModal from "@/components/auth/QuickInterestsModal";
import PendingConnectionsModal from "@/components/connections/PendingConnectionsModal";
import { supabase } from "@/integrations/supabase/client";

const StreamlinedProfileSetup = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const [showInterestsModal, setShowInterestsModal] = useState(false);
  const [showPendingConnectionsModal, setShowPendingConnectionsModal] = useState(false);
  const [hasPendingConnections, setHasPendingConnections] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
      return;
    }
  }, [user, isLoading, navigate]);

  const handleProfileComplete = async () => {
    try {
      console.log("✅ Profile completed! Checking if interests modal should be shown...");
      
      // Check if this is a new signup that should see interests modal
      const isNewSignUp = localStorage.getItem("newSignUp") === "true";
      
      // Check for pending connections
      if (user) {
        const { data: pendingConnections } = await supabase
          .from('user_connections')
          .select('id')
          .eq('connected_user_id', user.id)
          .eq('status', 'pending');
        
        const hasPending = (pendingConnections?.length || 0) > 0;
        setHasPendingConnections(hasPending);
        
        if (hasPending) {
          console.log("🎁 Found pending connections, will show modal after interests");
        }
      }
      
      if (isNewSignUp) {
        console.log("🎯 New signup detected, showing interests modal");
        setShowInterestsModal(true);
      } else if (hasPendingConnections) {
        console.log("📬 Showing pending connections modal");
        setShowPendingConnectionsModal(true);
      } else {
        console.log("📍 Existing user or no pending connections, routing based on signup context");
        
        // Intelligent routing - existing users without context → /home
        const signupContext = localStorage.getItem("signupContext");
        let destination = "/"; // Default for existing users
        
        if (signupContext === "gift_recipient") {
          destination = "/wishlists";
        } else if (signupContext === "gift_giver") {
          destination = "/gifting";
        }
        
        console.log(`🎯 Routing ${signupContext || 'existing user'} to ${destination}`);
        
        // Clean up context flag
        localStorage.removeItem("signupContext");
        
        navigate(destination, { replace: true });
      }
    } catch (error) {
      console.error("❌ Error in profile completion flow:", error);
      // Fallback: route to home on error
      navigate("/", { replace: true });
    }
  };

  const handleInterestsComplete = () => {
    try {
      console.log("✅ Interests completed! Checking for pending connections...");
      
      setShowInterestsModal(false);
      
      // Show pending connections modal if there are any
      if (hasPendingConnections) {
        console.log("📬 Showing pending connections modal");
        setShowPendingConnectionsModal(true);
      } else {
        console.log("📍 No pending connections, routing based on signup context");
        
        // Intelligent routing based on signup context
        const signupContext = localStorage.getItem("signupContext");
        let destination = "/"; // Default for existing users
        
        if (signupContext === "gift_recipient") {
          destination = "/wishlists";
        } else if (signupContext === "gift_giver") {
          destination = "/gifting";
        }
        
        console.log(`🎯 Routing ${signupContext || 'existing user'} to ${destination}`);
        
        // Clean up signup flags
        localStorage.removeItem("newSignUp");
        localStorage.removeItem("profileCompletionState");
        localStorage.removeItem("signupContext");
        
        navigate(destination, { replace: true });
      }
    } catch (error) {
      console.error("❌ Error in interests completion flow:", error);
      // Fallback: route to home on error
      navigate("/", { replace: true });
    }
  };

  const handleInterestsClose = () => {
    console.log("⏭️ Interests modal closed/skipped");
    handleInterestsComplete();
  };

  const handlePendingConnectionsClose = () => {
    try {
      console.log("✅ Pending connections modal closed, routing based on signup context...");
      
      // Intelligent routing based on signup context
      const signupContext = localStorage.getItem("signupContext");
      let destination = "/"; // Default for existing users
      
      if (signupContext === "gift_recipient") {
        destination = "/wishlists";
      } else if (signupContext === "gift_giver") {
        destination = "/gifting";
      }
      
      console.log(`🎯 Routing ${signupContext || 'existing user'} to ${destination}`);
      
      // Clean up signup flags
      localStorage.removeItem("newSignUp");
      localStorage.removeItem("profileCompletionState");
      localStorage.removeItem("signupContext");
      
      setShowPendingConnectionsModal(false);
      navigate(destination, { replace: true });
    } catch (error) {
      console.error("❌ Error in pending connections close flow:", error);
      // Fallback: route to home on error
      navigate("/", { replace: true });
    }
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

      <PendingConnectionsModal
        isOpen={showPendingConnectionsModal}
        onClose={handlePendingConnectionsClose}
        userId={user?.id || ''}
      />
    </MainLayout>
  );
};

export default StreamlinedProfileSetup;
