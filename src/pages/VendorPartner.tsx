
import React, { useEffect } from "react";
import { VendorHero } from "@/components/vendor/VendorHero";
import { BenefitsSection } from "@/components/vendor/BenefitsSection";
import { BusinessTypesSection } from "@/components/vendor/BusinessTypesSection";
import { HowItWorksSection } from "@/components/vendor/HowItWorksSection";
import { TestimonialsSection } from "@/components/vendor/TestimonialsSection";
import { VendorContactForm } from "@/components/vendor/VendorContactForm";
import { ReturnReductionSection } from "@/components/vendor/ReturnReductionSection";
import { VendorPortalFeaturesSection } from "@/components/vendor/VendorPortalFeaturesSection";

const VendorPartner = () => {
  const scrollToContactForm = () => {
    document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-white">
      <div className="container mx-auto px-4 py-16">
        <VendorHero onContactClick={scrollToContactForm} />
        <BenefitsSection />
        <ReturnReductionSection />
        <VendorPortalFeaturesSection />
        <BusinessTypesSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <VendorContactForm id="contact-form" />
      </div>
    </div>
  );
};

export default VendorPartner;
