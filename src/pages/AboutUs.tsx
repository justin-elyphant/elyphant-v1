import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import SEOWrapper from "@/components/seo/SEOWrapper";
import { organizationSchema, websiteSchema } from "@/components/seo/schemas";
import { Card, CardContent } from "@/components/ui/card";
import { Info, Gift, GraduationCap, Heart } from "lucide-react";

const AboutUs = () => {
  const aboutSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "mainEntity": organizationSchema,
    "description": "Learn about Elyphant's mission to transform gifting through AI-powered automation while supporting wildlife conservation efforts.",
    "url": "https://elyphant.ai/about"
  };

  return (
    <SEOWrapper
      title="About Elyphant - AI-Powered Gifting Platform & Wildlife Conservation"
      description="Discover Elyphant's story, mission to revolutionize thoughtful gifting through automation, and our commitment to elephant conservation and wildlife protection."
      keywords="about elyphant, AI gifting platform, automated gifting, wildlife conservation, elephant protection, thoughtful gifts, company mission"
      url="/about"
      schema={[organizationSchema, websiteSchema, aboutSchema]}
    >
      <MainLayout>
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">About Elyphant</h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Transforming how people connect through thoughtful gifting
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 mb-16">
            {/* Our Story Card */}
            <div>
              <Card className="h-full">
                <CardContent className="pt-6">
                  <h2 className="text-2xl font-semibold mb-4 flex items-center">
                    <Info className="mr-2 text-purple-600" />
                    Our Story
                  </h2>
                  <p className="text-gray-700 mb-4">
                    Elyphant was born from a simple observation: despite our best intentions, 
                    we often forget or miss opportunities to show our loved ones we care through 
                    timely, thoughtful gifts.
                  </p>
                  <p className="text-gray-700 mb-4">
                    Our founders share a deep passion for strengthening connections between people. 
                    They envisioned a platform that would not only remind you of important occasions but
                    take care of the entire gifting process with the same care and attention you would.
                  </p>
                  <p className="text-gray-700">
                    Today, Elyphant has grown into a comprehensive gifting platform that helps thousands 
                    of people maintain and nurture their most important relationships through thoughtful, 
                    automated gifting.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Our Mission Card */}
            <div>
              <Card className="h-full">
                <CardContent className="pt-6">
                  <h2 className="text-2xl font-semibold mb-4 flex items-center">
                    <Gift className="mr-2 text-purple-600" />
                    Our Mission
                  </h2>
                  <p className="text-gray-700 mb-4">
                    We believe that meaningful connections shouldn't be left to chance or fall victim to 
                    our busy lives. Our mission is to ensure that no important moment goes uncelebrated 
                    and no relationship suffers from neglect.
                  </p>
                  <p className="text-gray-700 mb-4">
                    With our patented automated gifting technology, we've revolutionized how people 
                    maintain connections. Our platform remembers important dates, analyzes preferences, 
                    and delivers perfectly timed gifts that feel personal and thoughtful.
                  </p>
                  <p className="text-gray-700">
                    We're committed to making gifting effortless yet deeply meaningful, allowing you 
                    to be present for your loved ones even when life gets hectic.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="mb-16">
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-2xl font-semibold mb-4 flex items-center">
                  <Gift className="mr-2 text-purple-600" />
                  Reducing Retail Waste Through Smart Gifting
                </h2>
                
                <div className="bg-red-50 border-l-4 border-red-400 p-6 mb-6">
                  <h3 className="text-lg font-semibold text-red-800 mb-2">The Return Crisis</h3>
                  <p className="text-red-700 mb-2">
                    <strong>$850 billion</strong> - That's how much merchandise was returned in the US retail market in 2025, 
                    representing nearly 15.8% of all retail sales.
                  </p>
                  <p className="text-red-700 text-sm">
                    Source: National Retail Federation, October 2025
                  </p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-3">The Problem</h3>
                    <p className="text-gray-700 mb-4">
                      Traditional gifting often results in unwanted items that end up returned or, worse, 
                      discarded. The average return rate for gifts is significantly higher than regular purchases, 
                      contributing to massive environmental waste and retailer losses.
                    </p>
                    <p className="text-gray-700 mb-4">
                      Many returned items cannot be resold and end up in landfills, creating unnecessary 
                      environmental impact from production, shipping, and disposal.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-semibold mb-3">Our Solution: Smart Wishlists</h3>
                    <p className="text-gray-700 mb-4">
                      Elyphant's custom wishlist feature allows recipients to "get the gift they want" by 
                      curating personalized lists of desired items. Gift-givers can choose from these 
                      pre-approved options, dramatically reducing the likelihood of returns.
                    </p>
                    <p className="text-gray-700 mb-4">
                      By matching gifts to genuine preferences, we help ensure every present is meaningful, 
                      wanted, and keeps families and friends connected rather than creating waste.
                    </p>
                  </div>
                </div>
                
                <div className="bg-green-50 border-l-4 border-green-400 p-6 mt-6">
                  <h3 className="text-lg font-semibold text-green-800 mb-2">Our Environmental Goal</h3>
                  <p className="text-green-700">
                    Through thoughtful, preference-based gifting, we aim to reduce gift returns by 80% among our users, 
                    contributing to a more sustainable future while strengthening personal connections. Every perfect match 
                    means less waste and more joy.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mb-16">
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-2xl font-semibold mb-4 flex items-center">
                  <Heart className="mr-2 text-purple-600" />
                  Our Commitment to Wildlife
                </h2>
                
                <div className="md:flex gap-6">
                  <div className="md:w-1/2 mb-6 md:mb-0">
                    <p className="text-gray-700 mb-4">
                      At Elyphant, our commitment extends beyond human connections. We dedicate a portion of 
                      our profits to supporting wildlife conservation efforts around the world, with a 
                      special focus on elephant protection and habitat preservation.
                    </p>
                    <p className="text-gray-700 mb-4">
                      We believe that by protecting these magnificent creatures and their ecosystems, we're 
                      helping preserve the natural connections that sustain our planet.
                    </p>
                  </div>
                  
                  <div className="md:w-1/2">
                    <div className="rounded-lg overflow-hidden shadow-md">
                      <img 
                        src="https://images.unsplash.com/photo-1581852017103-68ac65514cf7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1074&q=80" 
                        alt="Elephants in their natural habitat" 
                        className="w-full h-auto object-cover"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-100 p-6 rounded-lg mt-6">
                  <h3 className="text-xl font-semibold mb-3 flex items-center">
                    <GraduationCap className="mr-2 text-purple-600" />
                    Why the Elephant?
                  </h3>
                  <p className="text-gray-700">
                    Our name and logo were inspired by elephants because they embody the very qualities 
                    we strive to bring to gifting. Elephants are renowned for their remarkable memory, 
                    deep emotional intelligence, and strong family bonds. They're naturally thoughtful, 
                    compassionate, and celebrate their connections through rituals and gatherings.
                  </p>
                  <p className="text-gray-700 mt-4">
                    Like these magnificent creatures, Elyphant remembers what matters, responds with 
                    emotional intelligence, and helps strengthen the bonds between people through 
                    meaningful gestures. We aspire to bring the same level of care, intelligence, and 
                    connection to your gifting experience.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </MainLayout>
    </SEOWrapper>
  );
};

export default AboutUs;