
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { ProductProvider } from "@/contexts/ProductContext";
import { ResponsiveNavigation } from "@/components/layout/ResponsiveNavigation";
import HeroSection from "@/components/home/sections/HeroSection";
import FeaturesSection from "@/components/home/sections/FeaturesSection";
import HomeCTA from "@/components/home/sections/HomeCTA";

const Home = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  // Show demo notifications for testers only when in development mode
  const isTestingMode = process.env.NODE_ENV === 'development' || 
                         window.location.hostname.includes('localhost');
  
  return (
    <ProductProvider>
      <div className="min-h-screen flex flex-col">
        <ResponsiveNavigation />
        <main className="flex-grow">
          {/* Hero Section */}
          <HeroSection />
          
          {/* Features Section */}
          <FeaturesSection />
          
          {/* How It Works Section */}
          <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">How It Works</h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Getting started is easy - follow these simple steps
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Step 1 */}
                <div className="relative p-6">
                  <div className="bg-purple-100 text-purple-600 rounded-full h-12 w-12 flex items-center justify-center text-xl font-bold mb-4">
                    1
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Create Your Profile</h3>
                  <p className="text-gray-600">
                    Sign up and customize your profile with your interests, important dates, and preferences.
                  </p>
                </div>
                
                {/* Step 2 */}
                <div className="relative p-6">
                  <div className="bg-purple-100 text-purple-600 rounded-full h-12 w-12 flex items-center justify-center text-xl font-bold mb-4">
                    2
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Build Your Network</h3>
                  <p className="text-gray-600">
                    Connect with friends and family to see their wishlists and share your own gift preferences.
                  </p>
                </div>
                
                {/* Step 3 */}
                <div className="relative p-6">
                  <div className="bg-purple-100 text-purple-600 rounded-full h-12 w-12 flex items-center justify-center text-xl font-bold mb-4">
                    3
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Exchange Perfect Gifts</h3>
                  <p className="text-gray-600">
                    Give and receive meaningful gifts that people actually want and will cherish.
                  </p>
                </div>
              </div>
            </div>
          </section>
          
          {/* Testimonials Section (if we have them) */}
          <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">What Our Users Say</h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Hear from people who have transformed their gift-giving experience
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Testimonial 1 */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                  <div className="mb-4">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4">
                    "I used to dread buying gifts, but this platform has changed everything. I now know exactly what my friends and family want!"
                  </p>
                  <p className="font-semibold">Sarah Johnson</p>
                </div>
                
                {/* Testimonial 2 */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                  <div className="mb-4">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4">
                    "The wishlist feature is a game-changer. My family now always gets me gifts I actually want instead of guessing."
                  </p>
                  <p className="font-semibold">Michael Chen</p>
                </div>
                
                {/* Testimonial 3 */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                  <div className="mb-4">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4">
                    "The reminders ensure I never forget an important birthday or anniversary again. This has saved me so many times!"
                  </p>
                  <p className="font-semibold">Emily Rodriguez</p>
                </div>
              </div>
            </div>
          </section>
          
          {/* Call to Action */}
          <HomeCTA />
        </main>
        
        <footer className="bg-gray-100 border-t py-8">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-4 md:mb-0">
                <p className="text-gray-600">
                  &copy; {new Date().getFullYear()} Elyphant. All rights reserved.
                </p>
              </div>
              
              <div className="flex space-x-6">
                <Link to="/privacy" className="text-gray-600 hover:text-purple-600">
                  Privacy
                </Link>
                <Link to="/terms" className="text-gray-600 hover:text-purple-600">
                  Terms
                </Link>
                <Link to="/contact" className="text-gray-600 hover:text-purple-600">
                  Contact
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </ProductProvider>
  );
};

export default Home;
