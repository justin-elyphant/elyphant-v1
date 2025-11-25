
import React from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Linkedin, Facebook, Instagram } from "lucide-react";

interface FooterProps {
  className?: string;
}

const Footer: React.FC<FooterProps> = ({ className }) => {
  return (
    <footer className={cn("bg-black mt-auto", className)}>
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div>
            <h3 className="font-semibold mb-4 text-white">Company</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="text-gray-400 hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/careers" className="text-gray-400 hover:text-white transition-colors">Careers</Link></li>
              <li><Link to="/press" className="text-gray-400 hover:text-white transition-colors">Press</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-white">For Vendors</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/vendor-partner" className="text-gray-400 hover:text-white transition-colors">Become a Vendor</Link></li>
              <li><Link to="/vendor-portal" className="text-gray-400 hover:text-white transition-colors">Vendor Portal</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-white">Support</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/help" className="text-gray-400 hover:text-white transition-colors">Help Center</Link></li>
              <li><Link to="/contact" className="text-gray-400 hover:text-white transition-colors">Contact Us</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-white">Legal & Admin</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-gray-400 hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link to="/sms-consent" className="text-gray-400 hover:text-white transition-colors">SMS Consent</Link></li>
              <li><Link to="/trunkline" className="text-gray-400 hover:text-white transition-colors">Trunkline</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">&copy; 2024 Elyphant. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a 
              href="https://www.linkedin.com/company/elyphant" 
              target="_blank" 
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Linkedin className="h-5 w-5" />
            </a>
            <a 
              href="https://www.facebook.com/elyphant" 
              target="_blank" 
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Facebook className="h-5 w-5" />
            </a>
            <a 
              href="https://www.instagram.com/elyphant" 
              target="_blank" 
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Instagram className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
