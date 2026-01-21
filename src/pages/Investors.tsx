import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import InvestorPitchDeck from "@/components/investors/InvestorPitchDeck";
import InvestorPasswordGate from "@/components/investors/InvestorPasswordGate";

const SESSION_KEY = "elyphant_investor_access";

const Investors = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const savedAuth = sessionStorage.getItem(SESSION_KEY);
    if (savedAuth === "authenticated") {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handleAuthenticated = () => {
    sessionStorage.setItem(SESSION_KEY, "authenticated");
    setIsAuthenticated(true);
  };

  // Prevent flash of content
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black" />
    );
  }

  return (
    <>
      <Helmet>
        <title>Investors | Elyphant - AI-Powered Gifting Platform</title>
        <meta 
          name="description" 
          content="Discover how Elyphant is revolutionizing the $250B gifting market with AI-powered automation and smart wishlists." 
        />
      </Helmet>
      {isAuthenticated ? (
        <InvestorPitchDeck />
      ) : (
        <InvestorPasswordGate onAuthenticated={handleAuthenticated} />
      )}
    </>
  );
};

export default Investors;
