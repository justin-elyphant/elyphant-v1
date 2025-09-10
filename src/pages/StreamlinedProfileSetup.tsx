
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import SimpleProfileForm from "@/components/profile-setup/SimpleProfileForm";

const StreamlinedProfileSetup = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
      return;
    }
  }, [user, isLoading, navigate]);

  const handleProfileComplete = () => {
    console.log("✅ Profile completed! Redirecting to gifting...");
    navigate('/gifting', { replace: true });
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
    </MainLayout>
  );
};

export default StreamlinedProfileSetup;
