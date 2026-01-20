import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import SEOWrapper from "@/components/seo/SEOWrapper";
import { organizationSchema, websiteSchema } from "@/components/seo/schemas";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Mail, FileText, Image, Users, Calendar, Globe } from "lucide-react";

const Press = () => {
  const pressSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Press & Media - Elyphant",
    "description": "Press kit, company information, and media resources for Elyphant, the AI-powered gifting platform.",
    "url": "https://elyphant.ai/press"
  };

  const companyFacts = [
    { label: "Founded", value: "2024" },
    { label: "Mission", value: "Revolutionizing gifting through AI automation" },
    { label: "Focus", value: "Strengthening human connections" },
    { label: "Conservation", value: "Supporting elephant protection" },
    { label: "Technology", value: "AI-powered personalization" },
    { label: "Impact Goal", value: "Reduce gift returns by 80%" }
  ];

  return (
    <SEOWrapper
      title="Press & Media Kit - Elyphant AI-Powered Gifting Platform"
      description="Press resources, company information, and media kit for Elyphant. Contact us for interviews, company information, and high-resolution assets."
      keywords="elyphant press, media kit, press release, company information, AI gifting startup press, journalist resources"
      url="/press"
      schema={[organizationSchema, websiteSchema, pressSchema]}
    >
      <MainLayout>
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Press & Media</h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Resources and information for journalists, bloggers, and media professionals
            </p>
          </div>

          {/* Current Status */}
          <div className="mb-16">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6 text-center">
                <FileText className="mx-auto mb-4 h-12 w-12 text-blue-600" />
                <h2 className="text-2xl font-semibold text-blue-900 mb-3">
                  Ready for Media Coverage
                </h2>
                <p className="text-blue-800 mb-4 max-w-2xl mx-auto">
                  While we haven't been featured in the press yet, we're building something exciting 
                  and are ready to share our story with the right media partners.
                </p>
                <p className="text-blue-700 text-sm">
                  Interested in covering AI-powered gifting, wildlife conservation, or startup innovation? Let's talk.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Media Contact */}
          <div className="mb-16">
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-2xl font-semibold mb-6 text-center">Media Inquiries</h2>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="text-center">
                    <Mail className="mx-auto mb-4 h-8 w-8 text-purple-600" />
                    <h3 className="text-lg font-semibold mb-2">Press Contact</h3>
                    <p className="text-gray-700 mb-2">For interviews, press releases, and media kits</p>
                    <Button 
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                      onClick={() => window.location.href = 'mailto:press@elyphant.ai?subject=Media%20Inquiry'}
                    >
                      press@elyphant.ai
                    </Button>
                  </div>
                  <div className="text-center">
                    <Users className="mx-auto mb-4 h-8 w-8 text-purple-600" />
                    <h3 className="text-lg font-semibold mb-2">Partnership Inquiries</h3>
                    <p className="text-gray-700 mb-2">For business partnerships and collaborations</p>
                    <Button 
                      variant="outline" 
                      className="border-purple-600 text-purple-600 hover:bg-purple-50"
                      onClick={() => window.location.href = 'mailto:partnerships@elyphant.ai?subject=Partnership%20Inquiry'}
                    >
                      partnerships@elyphant.ai
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Company Facts */}
          <div className="mb-16">
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-2xl font-semibold mb-6 text-center">Company Quick Facts</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {companyFacts.map((fact, index) => (
                    <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                      <h3 className="text-sm font-semibold text-purple-600 mb-1">{fact.label}</h3>
                      <p className="text-gray-700">{fact.value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Story Angles */}
          <div className="mb-16">
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-2xl font-semibold mb-6 text-center">Story Opportunities</h2>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <Globe className="mr-2 text-purple-600" />
                      Technology & Innovation
                    </h3>
                    <ul className="text-gray-700 space-y-2">
                      <li>• AI-powered personalization in e-commerce</li>
                      <li>• Reducing retail waste through smart recommendations</li>
                      <li>• The future of automated relationship management</li>
                      <li>• Startup innovation in the gifting industry</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <Calendar className="mr-2 text-purple-600" />
                      Social Impact
                    </h3>
                    <ul className="text-gray-700 space-y-2">
                      <li>• Technology startups supporting wildlife conservation</li>
                      <li>• The $850B retail return problem and solutions</li>
                      <li>• How AI can strengthen human relationships</li>
                      <li>• Corporate responsibility in emerging tech companies</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Available Resources */}
          <div className="mb-16">
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-2xl font-semibold mb-6 text-center">Available Resources</h2>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <Image className="mx-auto mb-4 h-8 w-8 text-purple-600" />
                    <h3 className="text-lg font-semibold mb-2">Brand Assets</h3>
                    <p className="text-gray-700 text-sm mb-4">
                      High-resolution logos, brand guidelines, and product screenshots
                    </p>
                    <Button variant="outline" size="sm" disabled>
                      <Download className="mr-2 h-4 w-4" />
                      Available on request
                    </Button>
                  </div>
                  
                  <div className="text-center">
                    <FileText className="mx-auto mb-4 h-8 w-8 text-purple-600" />
                    <h3 className="text-lg font-semibold mb-2">Company Information</h3>
                    <p className="text-gray-700 text-sm mb-4">
                      Detailed company background, mission, and founder information
                    </p>
                    <Button variant="outline" size="sm" disabled>
                      <Download className="mr-2 h-4 w-4" />
                      Available on request
                    </Button>
                  </div>
                  
                  <div className="text-center">
                    <Users className="mx-auto mb-4 h-8 w-8 text-purple-600" />
                    <h3 className="text-lg font-semibold mb-2">Executive Interviews</h3>
                    <p className="text-gray-700 text-sm mb-4">
                      Founders and key team members available for interviews
                    </p>
                    <Button variant="outline" size="sm" disabled>
                      <Calendar className="mr-2 h-4 w-4" />
                      Schedule on request
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="pt-8 pb-8">
                <h2 className="text-2xl font-semibold text-purple-900 mb-4">
                  Let's Tell Our Story Together
                </h2>
                <p className="text-purple-800 mb-6 max-w-2xl mx-auto">
                  We're passionate about our mission to revolutionize gifting while supporting wildlife conservation. 
                  If you're interested in covering our story, we'd love to connect.
                </p>
                <Button 
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={() => window.location.href = 'mailto:press@elyphant.ai?subject=Story%20Inquiry%20-%20Elyphant'}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Get in touch
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </MainLayout>
    </SEOWrapper>
  );
};

export default Press;