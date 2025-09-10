import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import SEOWrapper from "@/components/seo/SEOWrapper";

const About: React.FC = () => {
  return (
    <SEOWrapper
      title="About Us - Elyphant | AI-Powered Gift Discovery Platform"
      description="Learn about Elyphant's mission to revolutionize gift-giving through AI-powered personalized recommendations and seamless shopping experiences."
      keywords="about elyphant, AI gift platform, personalized gifting, gift discovery, company mission"
      url="/about"
    >
      <MainLayout>
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                About Elyphant
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                We're revolutionizing gift-giving through AI-powered personalized recommendations, 
                making every gift meaningful and every moment special.
              </p>
            </div>

            {/* Mission Section */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold mb-6 text-center">Our Mission</h2>
              <div className="bg-muted/30 rounded-lg p-8">
                <p className="text-lg leading-relaxed text-center">
                  At Elyphant, we believe that the perfect gift has the power to strengthen relationships, 
                  create lasting memories, and express what words sometimes cannot. Our AI-powered platform 
                  learns from your connections and preferences to suggest gifts that truly resonate, 
                  making gift-giving effortless and meaningful.
                </p>
              </div>
            </section>

            {/* Values Section */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold mb-8 text-center">Our Values</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Personalization</h3>
                  <p className="text-muted-foreground">
                    Every recommendation is tailored to the unique relationship between giver and receiver.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🚀</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Innovation</h3>
                  <p className="text-muted-foreground">
                    We leverage cutting-edge AI technology to continuously improve the gifting experience.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">💝</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Thoughtfulness</h3>
                  <p className="text-muted-foreground">
                    We help you give gifts that show how much you care and understand the recipient.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🌟</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Simplicity</h3>
                  <p className="text-muted-foreground">
                    Complex AI technology behind a beautifully simple and intuitive user experience.
                  </p>
                </div>
              </div>
            </section>

            {/* How It Works Section */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold mb-8 text-center">How Elyphant Works</h2>
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xl">
                    1
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">Connect & Learn</h3>
                    <p className="text-muted-foreground">
                      Our AI learns about you and your connections through your interactions, preferences, and feedback.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xl">
                    2
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">Smart Recommendations</h3>
                    <p className="text-muted-foreground">
                      Get personalized gift suggestions based on the recipient's interests, your relationship, and the occasion.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xl">
                    3
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">Seamless Gifting</h3>
                    <p className="text-muted-foreground">
                      Purchase and send gifts directly through our platform with easy checkout and delivery tracking.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Contact Section */}
            <section className="text-center">
              <h2 className="text-3xl font-bold mb-6">Get in Touch</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Have questions or feedback? We'd love to hear from you.
              </p>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Email: <a href="mailto:hello@elyphant.ai" className="text-primary hover:underline">hello@elyphant.ai</a>
                </p>
                <p className="text-muted-foreground">
                  Address: 422 Cribbage Ln. San Marcos, CA 92078
                </p>
              </div>
            </section>
          </div>
        </div>
      </MainLayout>
    </SEOWrapper>
  );
};

export default About;