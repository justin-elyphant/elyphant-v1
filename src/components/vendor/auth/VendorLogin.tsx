
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
    <div className="flex flex-col min-h-screen bg-slate-100">
      <div className="container max-w-md mx-auto py-10 px-4 flex-grow flex items-center justify-center">
        <Card className="w-full bg-white shadow-lg border-slate-200">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <h1 className="text-2xl font-bold text-slate-800">Vendor Portal</h1>
            </div>
            <CardTitle className="text-xl text-slate-700">Sign In</CardTitle>
            <CardDescription className="text-slate-500">
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
                  className="w-full border-slate-300"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Password</label>
                <Input 
                  type="password" 
                  placeholder="Enter your password"  
                  className="w-full border-slate-300"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Sign In
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link 
              to="/forgot-password" 
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Forgot password?
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default VendorLogin;
