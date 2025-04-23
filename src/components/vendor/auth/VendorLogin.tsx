
import React from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const VendorLogin = () => {
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Bypass auth for testing
    navigate("/vendor-management");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="container max-w-md mx-auto py-10 px-4 bg-gradient-to-br from-[#9b87f5] to-[#6E59A5] flex-grow flex items-center justify-center">
        <Card className="w-full bg-white/90 backdrop-blur-sm shadow-2xl border-none">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <h1 className="text-2xl font-bold text-[#6E59A5]">Vendor Portal</h1>
            </div>
            <CardTitle className="text-xl text-[#6E59A5]">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to manage your product listings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Email</label>
                <Input 
                  type="email" 
                  placeholder="Enter your email"
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Password</label>
                <Input 
                  type="password" 
                  placeholder="Enter your password"
                  className="w-full"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-[#6E59A5] hover:bg-[#9b87f5] text-white"
              >
                Sign In
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Link 
              to="/forgot-password" 
              className="text-sm text-[#6E59A5] hover:text-[#9b87f5]"
            >
              Forgot password?
            </Link>
            <p className="text-sm text-slate-600">
              Don't have an account?{" "}
              <Link 
                to="/vendor-signup" 
                className="text-[#6E59A5] hover:text-[#9b87f5] font-medium"
              >
                Sign up
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default VendorLogin;
