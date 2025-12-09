import React from "react";
import { Star, Users, ShoppingBag, Award } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { FullBleedSection } from "@/components/layout/FullBleedSection";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { triggerHapticFeedback } from "@/utils/haptics";
import { motion } from "framer-motion";

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

  const handleCarouselChange = () => {
    triggerHapticFeedback('selection');
  };

  return (
    <FullBleedSection 
      background="bg-gradient-to-r from-purple-600 to-indigo-600" 
      height="large"
      className="text-white overflow-hidden pb-safe"
    >
      {/* Center all content vertically */}
      <div className="flex flex-col justify-center h-full">
        {/* Stats Section */}
        <div className="mb-8 md:mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Trusted by Gift Givers Worldwide
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <motion.div 
                key={index} 
                className="text-center touch-manipulation"
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <div className="flex items-center justify-center mb-2 text-purple-200 w-12 h-12 mx-auto">
                  {stat.icon}
                </div>
                <div className="text-2xl md:text-3xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm text-purple-200">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Testimonials - Full bleed carousel */}
        <div className="w-full">
          <h3 className="text-xl md:text-2xl font-semibold text-center mb-6">
            What Our Users Say
          </h3>
          
          {/* Extend carousel beyond content padding for true bleed */}
          <div className="-mx-4 md:-mx-6">
            <Carousel
              opts={{
                align: "center",
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent 
                className="-ml-2 md:-ml-4"
                onPointerDown={handleCarouselChange}
              >
                {testimonials.map((testimonial, index) => (
                  <CarouselItem key={index} className="pl-2 md:pl-4 basis-4/5 sm:basis-1/2 lg:basis-1/3">
                    <motion.div 
                      className="bg-white/10 backdrop-blur-sm rounded-xl p-6 h-full mx-2 touch-manipulation"
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    >
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
                    </motion.div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
        </div>
      </div>
    </FullBleedSection>
  );
};

export default SocialProofSection;
