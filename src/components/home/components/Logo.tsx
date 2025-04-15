
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { useNavigate } from "react-router-dom";

const Logo = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLogoClick = () => {
    // Always navigate to homepage, clearing any setup flags
    localStorage.removeItem("newSignUp");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("nextStepsOption");
    localStorage.removeItem("profileCompleted");
    
    console.log("Logo clicked, navigating to homepage");
    navigate("/");
  };

  return (
    <div onClick={handleLogoClick} className="cursor-pointer flex items-center">
      <img 
        src="/lovable-uploads/f2de31b2-3028-48b8-b4ce-22ed58bbcf81.png" 
        alt="Elyphant" 
        className="h-16 w-16 mr-2" 
      />
      <h1 className="text-2xl font-bold">Elyphant</h1>
    </div>
  );
};

export default Logo;
