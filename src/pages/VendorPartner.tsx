
import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import { VendorHero } from "@/components/vendor/VendorHero";
import { BenefitsSection } from "@/components/vendor/BenefitsSection";
import { BusinessTypesSection } from "@/components/vendor/BusinessTypesSection";
import { HowItWorksSection } from "@/components/vendor/HowItWorksSection";
import { TestimonialsSection } from "@/components/vendor/TestimonialsSection";
import { VendorContactForm } from "@/components/vendor/VendorContactForm";

const VendorPartner = () => {
  const scrollToContactForm = () => {
    document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <MainLayout>
      <div className="bg-gradient-to-b from-purple-50 to-white">
        <div className="container mx-auto px-4 py-16">
          {/* Hero Section */}
          <VendorHero onContactClick={scrollToContactForm} />

          {/* Benefits Section */}
          <BenefitsSection />

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
    </MainLayout>
  );
};

export default VendorPartner;
