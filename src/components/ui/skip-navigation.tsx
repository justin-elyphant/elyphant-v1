
import React from "react";
import { cn } from "@/lib/utils";

interface SkipNavigationProps {
  links: Array<{
    href: string;
    label: string;
  }>;
  className?: string;
}

const SkipNavigation: React.FC<SkipNavigationProps> = ({
  links = [
    { href: "#main-content", label: "Skip to main content" },
    { href: "#navigation", label: "Skip to navigation" },
    { href: "#search", label: "Skip to search" }
  ],
  className
}) => {
  return (
    <nav className={cn("sr-only focus-within:not-sr-only", className)} aria-label="Skip navigation">
      <ul className="flex gap-2 p-2 bg-black text-white fixed top-0 left-0 z-50">
        {links.map((link, index) => (
          <li key={index}>
            <a
              href={link.href}
              className="skip-link px-3 py-2 bg-blue-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-white"
              onFocus={(e) => {
                // Ensure the skip link is visible when focused
                e.currentTarget.scrollIntoView({ block: 'center' });
              }}
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default SkipNavigation;
