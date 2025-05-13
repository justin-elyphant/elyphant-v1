
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { ProductProvider } from "@/contexts/ProductContext";
import { ResponsiveText } from "@/components/ui/responsive-text";
import { ResponsiveContainer } from "@/components/layout/ResponsiveContainer";
import { ResponsiveNavigation } from "@/components/layout/ResponsiveNavigation";
import { OrderNotificationDemo } from "@/components/notifications/OrderStatusNotification";

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
          <section className={`bg-gradient-to-br from-indigo-100 to-purple-50 ${isMobile ? 'py-12' : 'py-20'}`}>
            <ResponsiveContainer>
              <div className="flex flex-col items-center text-center">
                <ResponsiveText 
                  as="h1"
                  mobileSize="3xl"
                  desktopSize="5xl"
                  className="font-bold text-slate-800 mb-4"
                >
                  Find the Perfect Gift
                </ResponsiveText>
                
                <ResponsiveText 
                  as="p"
                  mobileSize="base"
                  desktopSize="xl"
                  className="text-slate-600 max-w-2xl mx-auto mb-8"
                >
                  Take the guesswork out of gift-giving with personalized recommendations
                  tailored to your loved ones' preferences.
                </ResponsiveText>
                
                <div className={`flex ${isMobile ? 'flex-col w-full space-y-4' : 'flex-row space-x-4'}`}>
                  {user ? (
                    <>
                      <Button size={isMobile ? "default" : "lg"} asChild>
                        <Link to="/dashboard">Go to Dashboard</Link>
                      </Button>
                      <Button size={isMobile ? "default" : "lg"} variant="outline" asChild>
                        <Link to="/connections">Manage Connections</Link>
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size={isMobile ? "default" : "lg"} asChild>
                        <Link to="/signup">Get Started</Link>
                      </Button>
                      <Button size={isMobile ? "default" : "lg"} variant="outline" asChild>
                        <Link to="/login">Log In</Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </ResponsiveContainer>
          </section>
          
          {/* Features Section */}
          <section className={`py-12 ${isMobile ? 'space-y-8' : 'space-y-16'}`}>
            <ResponsiveContainer>
              <ResponsiveText 
                as="h2"
                mobileSize="2xl"
                desktopSize="3xl"
                className="font-bold text-center mb-8 text-slate-800"
              >
                How It Works
              </ResponsiveText>
              
              <div className={`grid ${isMobile ? 'grid-cols-1 gap-8' : 'grid-cols-3 gap-12'}`}>
                {/* Feature 1 */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="currentColor" className="text-primary"/>
                    </svg>
                  </div>
                  <ResponsiveText as="h3" mobileSize="xl" desktopSize="xl" className="font-semibold mb-2">
                    Connect with Friends
                  </ResponsiveText>
                  <p className="text-slate-600">
                    Build your network by connecting with friends and family to exchange wishlists.
                  </p>
                </div>
                
                {/* Feature 2 */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L6.5 11H17.5L12 2ZM12 5.84L13.93 9H10.06L12 5.84ZM17.5 13C15.01 13 13 15.01 13 17.5C13 19.99 15.01 22 17.5 22C19.99 22 22 19.99 22 17.5C22 15.01 19.99 13 17.5 13ZM17.5 20C16.12 20 15 18.88 15 17.5C15 16.12 16.12 15 17.5 15C18.88 15 20 16.12 20 17.5C20 18.88 18.88 20 17.5 20ZM3 13.5H11V15.5H3V13.5ZM3 16.5H11V18.5H3V16.5Z" fill="currentColor" className="text-primary"/>
                    </svg>
                  </div>
                  <ResponsiveText as="h3" mobileSize="xl" desktopSize="xl" className="font-semibold mb-2">
                    Create Wishlists
                  </ResponsiveText>
                  <p className="text-slate-600">
                    Build personalized wishlists with items you love from any online store.
                  </p>
                </div>
                
                {/* Feature 3 */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 6H17.82C17.93 5.69 18 5.35 18 5C18 3.34 16.66 2 15 2C13.95 2 13.04 2.54 12.5 3.35L12 4.02L11.5 3.34C10.96 2.54 10.05 2 9 2C7.34 2 6 3.34 6 5C6 5.35 6.07 5.69 6.18 6H4C2.89 6 2.01 6.89 2.01 8L2 19C2 20.11 2.89 21 4 21H20C21.11 21 22 20.11 22 19V8C22 6.89 21.11 6 20 6ZM15 4C15.55 4 16 4.45 16 5C16 5.55 15.55 6 15 6C14.45 6 14 5.55 14 5C14 4.45 14.45 4 15 4ZM9 4C9.55 4 10 4.45 10 5C10 5.55 9.55 6 9 6C8.45 6 8 5.55 8 5C8 4.45 8.45 4 9 4ZM20 19H4V8H20V19ZM8 13.16L9.41 11.75L11 13.34L14.59 9.75L16 11.16L11 16.16L8 13.16Z" fill="currentColor" className="text-primary"/>
                    </svg>
                  </div>
                  <ResponsiveText as="h3" mobileSize="xl" desktopSize="xl" className="font-semibold mb-2">
                    Find Perfect Gifts
                  </ResponsiveText>
                  <p className="text-slate-600">
                    Get AI-powered recommendations based on your connections' preferences.
                  </p>
                </div>
              </div>
            </ResponsiveContainer>
          </section>
          
          {/* CTA Section */}
          <section className={`bg-slate-900 text-white ${isMobile ? 'py-10' : 'py-16'}`}>
            <ResponsiveContainer>
              <div className="text-center">
                <ResponsiveText 
                  as="h2"
                  mobileSize="xl"
                  desktopSize="2xl"
                  className="font-bold mb-4"
                >
                  Ready to make gift-giving easier?
                </ResponsiveText>
                <p className={`text-slate-300 ${isMobile ? 'mb-6' : 'mb-8'} max-w-2xl mx-auto`}>
                  Join thousands of users who have simplified their gift-giving experience.
                </p>
                <Button 
                  size={isMobile ? "default" : "lg"}
                  variant="secondary"
                  asChild
                  className="bg-white text-slate-900 hover:bg-slate-100"
                >
                  <Link to="/signup">
                    Get Started for Free
                  </Link>
                </Button>
              </div>
            </ResponsiveContainer>
          </section>
          
          {/* Testing Tools Section (development only) */}
          {isTestingMode && (
            <div className="container mx-auto py-8 px-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Testing Tools</h2>
                <OrderNotificationDemo />
              </div>
            </div>
          )}
        </main>
        
        <footer className="bg-slate-50 border-t py-8">
          <ResponsiveContainer>
            <div className={`flex ${isMobile ? 'flex-col items-center' : 'flex-row items-center justify-between'}`}>
              <div className="text-center mb-4">
                <p className="text-sm text-slate-600">
                  &copy; {new Date().getFullYear()} Gift Giver. All rights reserved.
                </p>
              </div>
              
              {!isMobile && (
                <div className="flex space-x-6">
                  <a href="#" className="text-sm text-slate-600 hover:text-slate-900">
                    Privacy Policy
                  </a>
                  <a href="#" className="text-sm text-slate-600 hover:text-slate-900">
                    Terms of Service
                  </a>
                  <a href="#" className="text-sm text-slate-600 hover:text-slate-900">
                    Contact Us
                  </a>
                </div>
              )}
            </div>
          </ResponsiveContainer>
        </footer>
      </div>
    </ProductProvider>
  );
};

export default Home;
