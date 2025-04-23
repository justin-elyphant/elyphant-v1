
import React from "react";
import { Shield, CheckCircle, Star } from "lucide-react";

const TrustBar = () => {
  return (
    <div className="border-y border-gray-200">
      <div className="container py-8 px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center justify-center md:justify-start">
            <Shield className="h-6 w-6 text-slate-700 mr-2" />
            <span className="text-sm font-medium">Built with Stripe</span>
          </div>
          
          <div className="flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-slate-700 mr-2" />
            <span className="text-sm font-medium">Vendor Verified</span>
          </div>
          
          <div className="flex items-center justify-center md:justify-end">
            <Star className="h-6 w-6 text-slate-700 mr-2" />
            <span className="text-sm font-medium">Smart Gifting Starts Here</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrustBar;
