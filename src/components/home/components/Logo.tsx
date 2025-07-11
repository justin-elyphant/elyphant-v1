
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { useNavigate } from "react-router-dom";
import { LocalStorageService } from "@/services/localStorage/LocalStorageService";

const Logo = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLogoClick = () => {
    // Navigate to homepage with fresh context
    LocalStorageService.setNicoleContext({ 
      source: 'logo_click',
      currentPage: '/',
      timestamp: new Date().toISOString()
    });
    
    // Clean up deprecated keys
    LocalStorageService.cleanupDeprecatedKeys();
    
    console.log("Logo clicked, navigating to homepage");
    navigate("/");
  };

  return (
    <div onClick={handleLogoClick} className="cursor-pointer flex items-center">
      <img 
        src="/lovable-uploads/f2de31b2-3028-48b8-b4ce-22ed58bbcf81.png" 
        alt="Elyphant" 
        className="h-12 w-12 mr-3" 
      />
      <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent drop-shadow-sm">
        Elyphant
      </h1>
    </div>
  );
};

export default Logo;
