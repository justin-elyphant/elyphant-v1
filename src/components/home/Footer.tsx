
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { ShoppingBag } from "lucide-react";

const Footer = () => {
  const { user } = useAuth();
  const isInternalUser = user?.email?.endsWith('@elyphant.com') || user?.user_metadata?.isInternalUser;

  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="mb-6 md:mb-0">
            <h3 className="text-lg font-semibold mb-2">Elyphant</h3>
            <p className="text-gray-400 text-sm max-w-md">
              The future of gifting is automated. Connect with loved ones and let our platform handle 
              everything from selection to delivery.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <h4 className="font-medium mb-3">Platform</h4>
              <ul className="space-y-2">
                <li><Link to="/gifting" className="text-gray-400 hover:text-white text-sm">Gifting</Link></li>
                <li>
                  <Link 
                    to="/marketplace" 
                    className="flex items-center gap-1.5 text-sm bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent font-medium hover:from-indigo-500 hover:to-purple-600 transition-all group"
                  >
                    <ShoppingBag className="w-4 h-4 text-indigo-400 group-hover:text-indigo-500 transition-colors" />
                    <span className="border-b border-dashed border-indigo-400/40 group-hover:border-indigo-500/60 pb-px">
                      Marketplace
                    </span>
                  </Link>
                </li>
                <li><Link to="/trunkline-login" className="text-gray-400 hover:text-white text-sm">Trunkline</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Company</h4>
              <ul className="space-y-2">
                <li><Link to="/about-us" className="text-gray-400 hover:text-white text-sm">About Us</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Vendors</h4>
              <ul className="space-y-2">
                <li><Link to="/vendor-partner" className="text-gray-400 hover:text-white text-sm">Become a Vendor Partner</Link></li>
                <li><Link to="/vendor-login" className="text-gray-400 hover:text-white text-sm">Vendor Portal Signin</Link></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-6 text-sm text-gray-400">
          <p>© 2023 Elyphant. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
