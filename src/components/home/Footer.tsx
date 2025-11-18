
import React from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface FooterProps {
  className?: string;
}

const Footer: React.FC<FooterProps> = ({ className }) => {
  return (
    <footer className={cn("bg-gray-50 border-t mt-auto", className)}>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/about" className="hover:text-foreground">About Us</Link></li>
              <li><Link to="/careers" className="hover:text-foreground">Careers</Link></li>
              <li><Link to="/press" className="hover:text-foreground">Press</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">For Vendors</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/vendor-partner" className="hover:text-foreground">Become a Vendor</Link></li>
              <li><Link to="/vendor-portal" className="hover:text-foreground">Vendor Portal</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/help" className="hover:text-foreground">Help Center</Link></li>
              <li><Link to="/contact" className="hover:text-foreground">Contact Us</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Legal & Admin</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/privacy" className="hover:text-foreground">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-foreground">Terms of Service</Link></li>
              <li><Link to="/sms-consent" className="hover:text-foreground">SMS Consent</Link></li>
              <li><Link to="/trunkline" className="hover:text-foreground">Trunkline</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 Elyphant. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
