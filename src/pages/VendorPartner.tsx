
import React, { useEffect } from "react";
import { VendorHero } from "@/components/vendor/VendorHero";
import { BenefitsSection } from "@/components/vendor/BenefitsSection";
import { BusinessTypesSection } from "@/components/vendor/BusinessTypesSection";
import { HowItWorksSection } from "@/components/vendor/HowItWorksSection";
import { TestimonialsSection } from "@/components/vendor/TestimonialsSection";
import { VendorContactForm } from "@/components/vendor/VendorContactForm";
import { VendorPortalFeaturesSection } from "@/components/vendor/VendorPortalFeaturesSection";

const VendorPartner = () => {
  // Function to scroll to contact form
  const scrollToContactForm = () => {
    document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <VendorHero onContactClick={scrollToContactForm} />

        {/* Benefits Section */}
        <BenefitsSection />

        {/* Vendor Portal Features Section */}
        <VendorPortalFeaturesSection />

        {/* Vendor Types Section */}
        <BusinessTypesSection />

        {/* How It Works Section */}
        <HowItWorksSection />

        {/* Testimonials Section */}
        <TestimonialsSection />

        {/* Contact Form */}
        <VendorContactForm id="contact-form" />
      </div>
    </div>
  );
};

export default VendorPartner;
