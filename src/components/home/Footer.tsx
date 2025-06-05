
import React from "react";
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
              <li><a href="/about" className="hover:text-foreground">About Us</a></li>
              <li><a href="/careers" className="hover:text-foreground">Careers</a></li>
              <li><a href="/press" className="hover:text-foreground">Press</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">For Vendors</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="/vendor-partner" className="hover:text-foreground">Vendor Portal</a></li>
              <li><a href="/vendor-signup" className="hover:text-foreground">Vendor Sign Up</a></li>
              <li><a href="/vendor-login" className="hover:text-foreground">Vendor Login</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="/help" className="hover:text-foreground">Help Center</a></li>
              <li><a href="/contact" className="hover:text-foreground">Contact Us</a></li>
              <li><a href="/returns" className="hover:text-foreground">Returns</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Legal & Admin</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="/privacy" className="hover:text-foreground">Privacy Policy</a></li>
              <li><a href="/terms" className="hover:text-foreground">Terms of Service</a></li>
              <li><a href="/trunkline-login" className="hover:text-foreground">Trunkline</a></li>
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
