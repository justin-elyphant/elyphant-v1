
import React, { useEffect } from "react";
import Hero from "./Hero";
import { LocalStorageService } from "@/services/localStorage/LocalStorageService";

const HomeContent = () => {
  useEffect(() => {
    // Clear any lingering onboarding state that might show the "Welcome to Gift Giver" screen
    LocalStorageService.clearProfileCompletionState();
    LocalStorageService.cleanupDeprecatedKeys();
    
    // Set fresh context for homepage visit
    LocalStorageService.setNicoleContext({
      source: 'homepage_visit',
      currentPage: '/',
      timestamp: new Date().toISOString()
    });
  }, []);

  return (
    <div className="min-h-screen">
      <Hero />
    </div>
  );
};

export default HomeContent;
