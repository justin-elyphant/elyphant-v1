
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLocalStorage } from "@/components/gifting/hooks/useLocalStorage";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardGrid from "@/components/dashboard/DashboardGrid";

const Dashboard = () => {
  const [userData] = useLocalStorage("userData", null);
  const navigate = useNavigate();
  
  // Redirect to sign-up if not logged in
  useEffect(() => {
    if (!userData) {
      navigate("/sign-up");
    }
  }, [userData, navigate]);

  if (!userData) {
    return null; // Don't render anything while redirecting
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <DashboardHeader userData={userData} onLogout={() => {}} />
        <DashboardGrid />
      </div>
    </div>
  );
};

export default Dashboard;
