
import React from "react";
import { Star, Users, ShoppingBag, Award } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

const SocialProofSection = () => {
  const isMobile = useIsMobile();

  const testimonials = [
    {
      text: "Found the perfect gift for my mom in minutes! The AI recommendations were spot on.",
      author: "Sarah M.",
      rating: 5
    },
    {
      text: "Love how easy it is to create wishlists and share them with family. Game changer!",
      author: "Michael K.",
      rating: 5
    },
    {
      text: "The automated gift reminders saved my marriage. Never missing an anniversary again!",
      author: "David L.",
      rating: 5
    },
    {
      text: "Best gift platform I've used. The brand selection is incredible.",
      author: "Emma R.",
      rating: 5
    }
  ];

  const stats = [
    { icon: <Users className="h-5 w-5" />, value: "50K+", label: "Happy Users" },
    { icon: <ShoppingBag className="h-5 w-5" />, value: "1M+", label: "Gifts Given" },
    { icon: <Award className="h-5 w-5" />, value: "4.9", label: "App Rating" },
    { icon: <Star className="h-5 w-5" />, value: "99%", label: "Satisfaction" }
  ];

  return (
    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white overflow-hidden">
      {/* Full bleed container */}
      <div className={isMobile ? "px-0" : "container mx-auto px-4 md:px-6"}>
        <div className="py-12 md:py-16">
          {/* Stats Section */}
          <div className={`${isMobile ? "px-4" : ""} mb-8 md:mb-12`}>
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
              Trusted by Gift Givers Worldwide
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="flex items-center justify-center mb-2 text-purple-200">
                    {stat.icon}
                  </div>
                  <div className="text-2xl md:text-3xl font-bold mb-1">{stat.value}</div>
                  <div className="text-sm text-purple-200">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Testimonials */}
          <div className="w-full">
            <h3 className={`text-xl md:text-2xl font-semibold text-center mb-6 ${isMobile ? "px-4" : ""}`}>
              What Our Users Say
            </h3>
            
            <Carousel
              opts={{
                align: "center",
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent className={isMobile ? "-ml-2" : "-ml-4"}>
                {testimonials.map((testimonial, index) => (
                  <CarouselItem key={index} className={`${isMobile ? "pl-2 basis-4/5" : "pl-4 md:basis-1/2 lg:basis-1/3"}`}>
                    <div className={`bg-white/10 backdrop-blur-sm rounded-xl p-6 h-full ${isMobile ? "mx-2" : ""}`}>
                      <div className="flex items-center mb-3">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <blockquote className="text-white/90 mb-4 text-sm md:text-base leading-relaxed">
                        "{testimonial.text}"
                      </blockquote>
                      <cite className="text-purple-200 text-sm font-medium">
                        — {testimonial.author}
                      </cite>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialProofSection;
