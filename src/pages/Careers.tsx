import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import SEOWrapper from "@/components/seo/SEOWrapper";
import { organizationSchema, websiteSchema } from "@/components/seo/schemas";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Users, Lightbulb, Globe, Mail, Coffee, Zap } from "lucide-react";

const Careers = () => {
  const careersSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Careers at Elyphant",
    "description": "Join Elyphant's mission to revolutionize gifting through AI-powered automation while supporting wildlife conservation.",
    "url": "https://elyphant.ai/careers"
  };

  return (
    <SEOWrapper
      title="Careers at Elyphant - Join Our Mission to Transform Gifting"
      description="Explore career opportunities at Elyphant. Join our team working on AI-powered gifting automation while supporting wildlife conservation efforts."
      keywords="careers at elyphant, jobs, AI startup careers, gifting technology jobs, remote work, wildlife conservation careers"
      url="/careers"
      schema={[organizationSchema, websiteSchema, careersSchema]}
    >
      <MainLayout>
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Careers at Elyphant</h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Join us in revolutionizing how people connect through thoughtful, automated gifting
            </p>
          </div>

          {/* Current Status */}
          <div className="mb-16">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6 text-center">
                <Coffee className="mx-auto mb-4 h-12 w-12 text-blue-600" />
                <h2 className="text-2xl font-semibold text-blue-900 mb-3">
                  We're Growing, But Not Hiring Right Now
                </h2>
                <p className="text-blue-800 mb-4 max-w-2xl mx-auto">
                  While we don't have any open positions at the moment, we're always interested in connecting 
                  with talented individuals who share our passion for meaningful technology and wildlife conservation.
                </p>
                <p className="text-blue-700 text-sm">
                  Keep an eye on this page or reach out to learn about future opportunities!
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Our Culture */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-8">Why Work at Elyphant?</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              
              <Card>
                <CardContent className="pt-6 text-center">
                  <Heart className="mx-auto mb-4 h-8 w-8 text-purple-600" />
                  <h3 className="text-xl font-semibold mb-3">Meaningful Impact</h3>
                  <p className="text-gray-700">
                    Help strengthen human connections while supporting wildlife conservation. 
                    Every line of code contributes to both relationships and protecting elephants.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 text-center">
                  <Zap className="mx-auto mb-4 h-8 w-8 text-purple-600" />
                  <h3 className="text-xl font-semibold mb-3">Cutting-Edge AI</h3>
                  <p className="text-gray-700">
                    Work with the latest AI technologies to create personalized, intelligent 
                    gifting experiences that feel truly thoughtful and human.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 text-center">
                  <Globe className="mx-auto mb-4 h-8 w-8 text-purple-600" />
                  <h3 className="text-xl font-semibold mb-3">Remote-First Culture</h3>
                  <p className="text-gray-700">
                    Work from anywhere while collaborating with a passionate team dedicated 
                    to creating technology that brings people closer together.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 text-center">
                  <Users className="mx-auto mb-4 h-8 w-8 text-purple-600" />
                  <h3 className="text-xl font-semibold mb-3">Small Team, Big Impact</h3>
                  <p className="text-gray-700">
                    Your contributions matter. In our lean team, every person shapes the product 
                    and directly influences how millions of people connect.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 text-center">
                  <Lightbulb className="mx-auto mb-4 h-8 w-8 text-purple-600" />
                  <h3 className="text-xl font-semibold mb-3">Innovation Freedom</h3>
                  <p className="text-gray-700">
                    Bring your ideas to life. We encourage experimentation and creative 
                    problem-solving in everything from UX to AI algorithms.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 text-center">
                  <Heart className="mx-auto mb-4 h-8 w-8 text-purple-600" />
                  <h3 className="text-xl font-semibold mb-3">Values-Driven</h3>
                  <p className="text-gray-700">
                    Join a team that values empathy, intelligence, and genuine care for 
                    both our users and the planet we share.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Future Roles */}
          <div className="mb-16">
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-2xl font-semibold mb-6 text-center">
                  Roles We'll Be Looking For
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-purple-600">Engineering</h3>
                    <ul className="text-gray-700 space-y-1">
                      <li>• Full-Stack Engineers (React, Node.js)</li>
                      <li>• AI/ML Engineers</li>
                      <li>• Mobile Developers (React Native)</li>
                      <li>• DevOps Engineers</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-purple-600">Product & Design</h3>
                    <ul className="text-gray-700 space-y-1">
                      <li>• Product Managers</li>
                      <li>• UX/UI Designers</li>
                      <li>• Product Designers</li>
                      <li>• User Researchers</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-purple-600">Business</h3>
                    <ul className="text-gray-700 space-y-1">
                      <li>• Marketing Specialists</li>
                      <li>• Business Development</li>
                      <li>• Customer Success</li>
                      <li>• Operations Managers</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-purple-600">Data & Analytics</h3>
                    <ul className="text-gray-700 space-y-1">
                      <li>• Data Scientists</li>
                      <li>• Analytics Engineers</li>
                      <li>• Research Scientists</li>
                      <li>• Data Engineers</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Call to Action */}
          <div className="text-center mb-16">
            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="pt-8 pb-8">
                <h2 className="text-2xl font-semibold text-purple-900 mb-4">
                  Interested in Joining Our Mission?
                </h2>
                <p className="text-purple-800 mb-6 max-w-2xl mx-auto">
                  Even if we don't have the perfect role right now, we'd love to hear from you. 
                  Send us your resume and tell us how you'd like to contribute to revolutionizing gifting 
                  and supporting wildlife conservation.
                </p>
                <Button 
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={() => window.location.href = 'mailto:careers@elyphant.ai?subject=Future%20Opportunities%20at%20Elyphant'}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Send us your resume
                </Button>
                <p className="text-purple-600 text-sm mt-3">
                  careers@elyphant.ai
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Company Values */}
          <div className="mb-16">
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-2xl font-semibold mb-6 text-center">Our Values</h2>
                <div className="grid md:grid-cols-3 gap-6 text-center">
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-purple-600">Remember Everything</h3>
                    <p className="text-gray-700 text-sm">
                      Like elephants, we never forget what matters most to our users and their relationships.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-purple-600">Act with Intelligence</h3>
                    <p className="text-gray-700 text-sm">
                      We combine emotional and artificial intelligence to create meaningful connections.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-purple-600">Protect What We Value</h3>
                    <p className="text-gray-700 text-sm">
                      We're committed to protecting relationships, privacy, and the wildlife we're named after.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </MainLayout>
    </SEOWrapper>
  );
};

export default Careers;