
import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import HomeContent from "@/components/home/HomeContent";
import SEOWrapper from "@/components/seo/SEOWrapper";
import { organizationSchema, websiteSchema, webApplicationSchema } from "@/components/seo/schemas";

const Home = () => {
  const combinedSchema = [organizationSchema, websiteSchema, webApplicationSchema];

  return (
    <SEOWrapper
      title="Elyphant - AI-Powered Gift Discovery & Personalized Recommendations"
      description="Discover perfect gifts with AI-powered recommendations. Find meaningful presents for everyone with smart search, wishlists, and personalized suggestions. Start your gift journey today!"
      keywords="AI gifts, gift recommendations, personalized gifts, gift finder, smart gifting, AI shopping, gift ideas, automated gifting, gift discovery, thoughtful presents, perfect gifts, AI-powered shopping"
      schema={combinedSchema}
      url="/"
    >
      <MainLayout>
        <HomeContent />
      </MainLayout>
    </SEOWrapper>
  );
};

export default Home;
